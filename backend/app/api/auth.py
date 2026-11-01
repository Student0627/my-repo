"""
FineGuard - Authentication API Endpoints
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserResponse
from app.core.security import hash_password, verify_password, create_access_token, get_current_user_payload
from app.database.repo import Repository

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister):
    existing = await Repository.find_user_by_email(user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    hashed_pw = hash_password(user_in.password)
    user_doc = await Repository.create_user(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_pw
    )

    access_token = create_access_token(data={"sub": user_doc["id"], "email": user_doc["email"]})
    user_res = UserResponse(
        id=user_doc["id"],
        name=user_doc["name"],
        email=user_doc["email"],
        role=user_doc.get("role", "analyst")
    )

    return TokenResponse(access_token=access_token, user=user_res)

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await Repository.find_user_by_email(credentials.email)
    if not user or not verify_password(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    access_token = create_access_token(data={"sub": user["id"], "email": user["email"]})
    user_res = UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user.get("role", "analyst")
    )

    return TokenResponse(access_token=access_token, user=user_res)

@router.get("/me", response_model=UserResponse)
async def get_me(payload: dict = Depends(get_current_user_payload)):
    user_id = payload.get("sub")
    email = payload.get("email")
    user = await Repository.find_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user.get("role", "analyst")
    )
