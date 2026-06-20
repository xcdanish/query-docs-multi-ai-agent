from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi.security import OAuth2PasswordRequestForm

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, Token
from app.auth.password import get_password_hash, verify_password
from app.auth.jwt import create_access_token
from app.auth.dependencies import get_current_user
from app.utils.exceptions import BadRequestException, UnauthorizedException

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
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
