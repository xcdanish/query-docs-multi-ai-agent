from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

class AssetOut(BaseModel):
    id: UUID
    file_name: str
    file_type: str
    file_size: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatAssetLink(BaseModel):
    asset_id: UUID

class AssetResponse(BaseModel):
    status: str
    message: str
    data: Optional[AssetOut] = None

class AssetListResponse(BaseModel):
    status: str
    message: str
    data: list[AssetOut]
