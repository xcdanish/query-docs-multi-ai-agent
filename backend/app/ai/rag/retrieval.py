import uuid
import logging
from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchAny

from app.config.settings import settings
from app.ai.vectorstore.qdrant import qdrant_client
from app.ai.rag.embeddings import embeddings

logger = logging.getLogger(__name__)

def retrieve_context(
    query: str,
    user_id: uuid.UUID,
    asset_ids: list[uuid.UUID] = None,
    limit: int = 5
) -> list[dict]:
    """
    Queries Qdrant vector database for matching chunks.
    Filters results by user_id and optionally a list of linked asset_ids.
    """
    try:
        # 1. Generate Query Vector
        query_vector = embeddings.embed_query(query)
        
        # 2. Build Filter Conditions
        conditions = [
            FieldCondition(
                key="user_id",
                match=MatchValue(value=str(user_id))
            )
        ]
        
        # If specific assets are linked, filter queries only to those assets
        if asset_ids:
            conditions.append(
                FieldCondition(
                    key="asset_id",
                    match=MatchAny(any=[str(aid) for aid in asset_ids])
                )
            )
        else:
            # If no assets are linked to the chat, return empty context
            logger.info(f"No assets linked to query scope. Returning empty context.")
            return []
            
        query_filter = Filter(must=conditions)
        
        # 3. Perform Qdrant Vector Search
        response = qdrant_client.query_points(
            collection_name=settings.QDRANT_COLLECTION,
            query=query_vector,
            query_filter=query_filter,
            limit=limit
        )
        
        # 4. Format and Return Results
        retrieved_chunks = []
        for result in response.points:
            payload = result.payload or {}
            retrieved_chunks.append({
                "text": payload.get("text", ""),
                "page": payload.get("page", 1),
                "source": payload.get("source", ""),
                "score": result.score
            })

            
        logger.info(f"Retrieved {len(retrieved_chunks)} relevant chunks from Qdrant.")
        return retrieved_chunks
        
    except Exception as e:
        logger.error(f"Error performing vector search: {e}")
        return []
