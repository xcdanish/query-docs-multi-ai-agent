import logging
from qdrant_client import QdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from qdrant_client.models import Distance, VectorParams
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Initialize Qdrant Client
# When running inside Docker compose network, settings.QDRANT_HOST should be configured properly.
qdrant_client = QdrantClient(
    host=settings.QDRANT_HOST,
    port=settings.QDRANT_PORT
)

def init_qdrant_collection():
    """
    Ensures that the target Qdrant collection exists and is configured properly.
    Uses vector dimension 768 for nomic-embed-text model.
    """
    collection_name = settings.QDRANT_COLLECTION
    vector_size = 768  # Dimension for nomic-embed-text
    
    try:
        # Check if collection already exists
        collections = qdrant_client.get_collections().collections
        collection_names = [col.name for col in collections]
        
        if collection_name not in collection_names:
            logger.info(f"Creating Qdrant collection: '{collection_name}' with size {vector_size}")
            qdrant_client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE
                )
            )
            logger.info(f"Qdrant collection '{collection_name}' created successfully.")
        else:
            logger.info(f"Qdrant collection '{collection_name}' already exists.")
            
    except UnexpectedResponse as e:
        logger.error(f"Failed to check/create Qdrant collection due to response error: {e}")
    except Exception as e:
        logger.error(f"Unexpected error initializing Qdrant client/collection: {e}")
