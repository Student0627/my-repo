"""
FineGuard - Authentication Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

EMAIL_PATTERN = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=60, description="User full name")
    email: str = Field(..., pattern=EMAIL_PATTERN, description="Valid corporate or personal email")
    password: str = Field(..., min_length=6, max_length=128, description="Password with minimum 6 characters")

class UserLogin(BaseModel):
    email: str = Field(..., pattern=EMAIL_PATTERN)
    password: str = Field(...)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str = "analyst"
    created_at: Optional[datetime] = None

TokenResponse.model_rebuild()
