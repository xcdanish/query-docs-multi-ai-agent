import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, BigInteger, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.chat import chat_assets

class Asset(Base):
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(BigInteger, nullable=False)
    status = Column(String, nullable=False, default="UPLOADING")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="assets")
    chats = relationship("Chat", secondary=chat_assets, back_populates="assets")
    chunks = relationship("AssetChunk", back_populates="asset", cascade="all, delete-orphan")


class AssetChunk(Base):
    __tablename__ = "asset_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    qdrant_point_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    asset = relationship("Asset", back_populates="chunks")
