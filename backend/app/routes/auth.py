from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timezone, timedelta

from app.db.database import get_db
from app.models.user import User
from app.models.refresh_token import UserRefreshToken
from app.schemas.user import UserCreate, UserOut, Token, RefreshRequest
from app.auth.password import get_password_hash, verify_password
from app.auth.jwt import create_access_token, create_refresh_token
from app.auth.dependencies import get_current_user
from app.utils.exceptions import BadRequestException, UnauthorizedException
from app.config.settings import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    check_user_query = select(User).where(
        (User.username == user_in.username) | (User.email == user_in.email))
    result = await db.execute(check_user_query)
    if result.scalars().first():
        raise BadRequestException("Username or Email already registered")

    user = User(
        name=user_in.name,
        username=user_in.username,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    get_user_query = select(User).where(
        (User.username == form_data.username) | (User.email == form_data.username))
    result = await db.execute(get_user_query)
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise UnauthorizedException("Incorrect username or password")

    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token()

    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db_refresh_token = UserRefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    await db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
async def refresh(refresh_in: RefreshRequest, db: AsyncSession = Depends(get_db)):
    query = select(UserRefreshToken).where(UserRefreshToken.token == refresh_in.refresh_token)
    result = await db.execute(query)
    token_record = result.scalars().first()

    if not token_record or token_record.is_revoked or token_record.expires_at < datetime.now(timezone.utc):
        raise UnauthorizedException("Invalid or expired refresh token")

    user_query = select(User).where(User.id == token_record.user_id)
    user_result = await db.execute(user_query)
    user = user_result.scalars().first()

    if not user:
        raise UnauthorizedException("User not found")

    new_access_token = create_access_token(data={"sub": user.username})
    new_refresh_token = create_refresh_token()

    # Revoke/Delete old token
    await db.delete(token_record)

    # Insert new rotated refresh token
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db_refresh_token = UserRefreshToken(
        user_id=user.id,
        token=new_refresh_token,
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    await db.commit()

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.post("/logout")
async def logout(refresh_in: RefreshRequest, db: AsyncSession = Depends(get_db)):
    query = select(UserRefreshToken).where(UserRefreshToken.token == refresh_in.refresh_token)
    result = await db.execute(query)
    token_record = result.scalars().first()

    if token_record:
        await db.delete(token_record)
        await db.commit()

    return {"status": "success", "message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

