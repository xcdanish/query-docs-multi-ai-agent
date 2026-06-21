from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime

class ChatBase(BaseModel):
    title: str = Field(..., example="Explain LangGraph")

class ChatCreate(ChatBase):
    pass

class ChatOut(ChatBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    is_empty: bool = True

    class Config:
        from_attributes = True
