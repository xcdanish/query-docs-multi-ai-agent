from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.models.chat import Chat
from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageCreate, MessageOut
from app.auth.dependencies import get_current_user
from app.utils.exceptions import NotFoundException, UnauthorizedException

router = APIRouter(prefix="/chats", tags=["Messages"])

async def get_chat_or_404(chat_id: UUID, current_user: User, db: AsyncSession) -> Chat:
    """Helper to verify chat exists and belongs to user"""
    query = select(Chat).where((Chat.id == chat_id) & (Chat.user_id == current_user.id))
    result = await db.execute(query)
    chat = result.scalars().first()
    if not chat:
        raise NotFoundException("Chat not found or unauthorized")
    return chat

@router.get("/{chat_id}/messages", response_model=List[MessageOut])
async def get_chat_messages(
    chat_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch all messages for a specific chat"""
    # Verify ownership
    await get_chat_or_404(chat_id, current_user, db)

    # Fetch messages ordered by creation time
    query = select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at.asc())
    result = await db.execute(query)
    messages = result.scalars().all()
    return messages

@router.post("/{chat_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def create_chat_message(
    chat_id: UUID,
    message_in: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a new message to a specific chat"""
    # Verify ownership
    await get_chat_or_404(chat_id, current_user, db)

    # Create message
    new_message = Message(
        chat_id=chat_id,
        role=message_in.role,
        content=message_in.content,
        agent_name=message_in.agent_name,
        metadata_json=message_in.metadata_json
    )
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    return new_message
