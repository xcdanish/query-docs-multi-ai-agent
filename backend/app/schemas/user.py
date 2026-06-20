from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    name: str = Field(..., example="Mohammed Danish")
    username: str = Field(..., example="mdanish")
    email: EmailStr = Field(..., example="danish@example.com")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, example="secret123")

class UserLogin(BaseModel):
    email_or_username: str = Field(..., example="danish@example.com")
    password: str = Field(..., example="secret123")

class UserOut(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
