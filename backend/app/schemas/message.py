from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class MessageBase(BaseModel):
    # Core attributes
    role: str = Field(..., example="user", description="Role of the sender (user, assistant, system)")
    content: str = Field(..., example="What is LangGraph?", description="Message content")
    
    # Optional/Nullable attributes
    agent_name: Optional[str] = Field(None, example="ResearchAgent", description="Name of the agent if role is assistant")
    metadata_json: Optional[Dict[str, Any]] = Field(None, description="Additional structured data")

class MessageCreate(MessageBase):
    pass

class MessageOut(MessageBase):
    # Identifiers
    id: UUID
    chat_id: UUID
    
    # System/Timestamps
    created_at: datetime

    class Config:
        from_attributes = True
