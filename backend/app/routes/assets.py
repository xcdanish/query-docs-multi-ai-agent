import os
import uuid
import asyncio
from fastapi import APIRouter, Depends, UploadFile, File, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.database import get_db, AsyncSessionLocal
from app.models.user import User
from app.models.document import Asset
from app.auth.dependencies import get_current_user
from app.schemas.asset import AssetOut, AssetResponse, AssetListResponse
from app.utils.exceptions import NotFoundException, BadRequestException
from app.ai.rag.indexing import index_document

router = APIRouter(prefix="/assets", tags=["Assets"])

UPLOAD_DIR = "uploads/assets"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def index_asset_task(file_path: str, asset_id: uuid.UUID, user_id: uuid.UUID):
    """
    Background task to run custom RAG indexing and update database status.
    """
    success = await asyncio.to_thread(index_document, file_path, asset_id, user_id)
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Asset).filter(Asset.id == asset_id))
        asset = result.scalar_one_or_none()
        if asset:
            asset.status = "READY" if success else "FAILED"
            await session.commit()

@router.post("/upload", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def upload_asset(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Generate unique filename to avoid collisions
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        # Save file to disk
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        file_size = len(contents)

        # Create Asset record in DB with PROCESSING status
        asset = Asset(
            user_id=current_user.id,
            file_name=file.filename or "unknown",
            file_type=file.content_type or "application/octet-stream",
            file_path=file_path,
            file_size=file_size,
            status="PROCESSING"
        )
        db.add(asset)
        await db.commit()
        await db.refresh(asset)

        # Trigger background task for indexing
        background_tasks.add_task(index_asset_task, file_path, asset.id, current_user.id)

        return AssetResponse(
            status="success",
            message="Asset upload started and is processing in the background",
            data=AssetOut.model_validate(asset)
        )

    except Exception as e:
        await db.rollback()
        raise BadRequestException(f"Failed to upload asset: {str(e)}")

@router.get("", response_model=AssetListResponse)
async def get_assets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Asset).filter(Asset.user_id == current_user.id).order_by(Asset.created_at.desc()))
    assets = result.scalars().all()
    return AssetListResponse(
        status="success",
        message="Assets retrieved successfully",
        data=[AssetOut.model_validate(a) for a in assets]
    )

@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Asset).filter(Asset.id == asset_id, Asset.user_id == current_user.id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise NotFoundException("Asset not found")
    
    return AssetResponse(
        status="success",
        message="Asset retrieved successfully",
        data=AssetOut.model_validate(asset)
    )

@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Asset).filter(Asset.id == asset_id, Asset.user_id == current_user.id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise NotFoundException("Asset not found")
    
    # Delete file from disk if exists
    if os.path.exists(asset.file_path):
        try:
            os.remove(asset.file_path)
        except Exception:
            pass # ignore if file already gone

    await db.delete(asset)
    await db.commit()
    return None
