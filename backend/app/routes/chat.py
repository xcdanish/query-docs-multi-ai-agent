from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.models.chat import Chat
from app.models.user import User
from app.schemas.chat import ChatCreate, ChatOut
from app.auth.dependencies import get_current_user
from app.utils.exceptions import NotFoundException

router = APIRouter(prefix="/chat", tags=["Chats"])


@router.post("/create", response_model=ChatOut, status_code=status.HTTP_201_CREATED)
async def create_chat(
    chat_in: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_chat = Chat(
        user_id=current_user.id,
        title=chat_in.title
    )
    db.add(new_chat)
    await db.commit()
    await db.refresh(new_chat)
    return new_chat


@router.get("/get", response_model=List[ChatOut])
async def get_chats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    get_chats_query = select(Chat).where(
        Chat.user_id == current_user.id).order_by(Chat.created_at.desc())
    result = await db.execute(get_chats_query)
    chats = result.scalars().all()
    return chats


@router.get("/get/{chat_id}", response_model=ChatOut)
async def get_chat(
    chat_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    get_chat_query = select(Chat).where(
        (Chat.id == chat_id) & (Chat.user_id == current_user.id))
    result = await db.execute(get_chat_query)
    chat = result.scalars().first()

    if not chat:
        raise NotFoundException("Chat not found")

    return chat


@router.delete("/delete/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    chat_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    get_chat_query = select(Chat).where(
        (Chat.id == chat_id) & (Chat.user_id == current_user.id))
    result = await db.execute(get_chat_query)
    chat = result.scalars().first()

    if not chat:
        raise NotFoundException("Chat not found")

    await db.delete(chat)
    await db.commit()
    return None
