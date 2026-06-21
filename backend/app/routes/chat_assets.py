import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.user import User
from app.models.chat import Chat
from app.models.document import Asset
from app.auth.dependencies import get_current_user
from app.schemas.asset import ChatAssetLink
from app.utils.exceptions import NotFoundException, BadRequestException

router = APIRouter(prefix="/chats", tags=["Chat Assets"])

@router.post("/{chat_id}/assets", status_code=status.HTTP_201_CREATED)
async def link_asset_to_chat(
    chat_id: uuid.UUID,
    payload: ChatAssetLink,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify chat exists and belongs to user, load assets eagerly to manipulate them
    result = await db.execute(
        select(Chat).options(selectinload(Chat.assets)).filter(Chat.id == chat_id, Chat.user_id == current_user.id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise NotFoundException("Chat not found")
    
    # Verify asset exists and belongs to user
    asset_result = await db.execute(
        select(Asset).filter(Asset.id == payload.asset_id, Asset.user_id == current_user.id)
    )
    asset = asset_result.scalar_one_or_none()
    if not asset:
        raise NotFoundException("Asset not found")
    
    # Check if already linked
    if any(a.id == asset.id for a in chat.assets):
        return {"status": "success", "message": "Asset already linked to chat"}
    
    # Link asset to chat
    chat.assets.append(asset)
    await db.commit()
    
    return {"status": "success", "message": "Asset linked to chat successfully"}

@router.delete("/{chat_id}/assets/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_asset_from_chat(
    chat_id: uuid.UUID,
    asset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify chat exists and belongs to user, load assets eagerly
    result = await db.execute(
        select(Chat).options(selectinload(Chat.assets)).filter(Chat.id == chat_id, Chat.user_id == current_user.id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise NotFoundException("Chat not found")
    
    # Find asset in chat
    asset_to_remove = next((a for a in chat.assets if a.id == asset_id), None)
    if not asset_to_remove:
        raise NotFoundException("Asset not found in this chat")
    
    # Remove link
    chat.assets.remove(asset_to_remove)
    await db.commit()
    
    return None
