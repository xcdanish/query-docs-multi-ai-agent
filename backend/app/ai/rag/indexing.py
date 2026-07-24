import os
import uuid
import logging
from pypdf import PdfReader
from langchain_core.documents import Document
from qdrant_client.models import PointStruct

from app.config.settings import settings
from app.ai.vectorstore.qdrant import qdrant_client
from app.ai.rag.embeddings import embeddings
from app.ai.rag.chunking import get_text_splitter

logger = logging.getLogger(__name__)

def load_pdf_to_documents(file_path: str, file_name: str = None) -> list[Document]:
    """
    Reads a PDF file using pypdf and extracts clean text page-by-page.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found at: {file_path}")
        
    reader = PdfReader(file_path)
    documents = []
    source_name = file_name or os.path.basename(file_path)
    
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            # We add 1 to page number so it is 1-indexed
            documents.append(
                Document(
                    page_content=text,
                    metadata={
                        "page": i + 1,
                        "source": source_name
                    }
                )
            )
            
    return documents

def index_document(file_path: str, asset_id: uuid.UUID, user_id: uuid.UUID, file_name: str = None) -> bool:
    """
    Ingests a PDF document, splits it, generates embeddings, and uploads to Qdrant.
    """
    try:
        logger.info(f"Starting ingestion for asset {asset_id} uploaded by user {user_id}")
        
        # Resolve original filename for metadata
        original_filename = file_name or os.path.basename(file_path)
            
        # 1. Load documents
        raw_docs = load_pdf_to_documents(file_path, file_name=original_filename)
        if not raw_docs:
            logger.warning(f"No text extracted from document: {file_path}")
            return False

            
        # 2. Split documents into chunks
        splitter = get_text_splitter()
        chunks = splitter.split_documents(raw_docs)
        logger.info(f"Split document into {len(chunks)} chunks.")
        
        # 3. Generate embeddings
        texts = [chunk.page_content for chunk in chunks]
        vectors = embeddings.embed_documents(texts)
        
        # 4. Prepare Qdrant Points
        points = []
        for idx, (chunk, vector) in enumerate(zip(chunks, vectors)):
            point_id = str(uuid.uuid4())
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "asset_id": str(asset_id),
                        "user_id": str(user_id),
                        "text": chunk.page_content,
                        "page": chunk.metadata.get("page", 1),
                        "source": chunk.metadata.get("source", "")
                    }
                )
            )
            
        # 5. Upsert points into Qdrant collection
        if points:
            qdrant_client.upsert(
                collection_name=settings.QDRANT_COLLECTION,
                points=points
            )
            logger.info(f"Successfully upserted {len(points)} vectors into Qdrant collection '{settings.QDRANT_COLLECTION}'.")
            return True
            
        return False
        
    except Exception as e:
        logger.error(f"Error indexing document {file_path}: {e}")
        return False
