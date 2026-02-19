"""
Dash24 V1 - JWT Authentication & Security
Strict JWT validation with proper error handling
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt, ExpiredSignatureError
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, Brand
from app.models.enums import UserRole
from app.core.settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


class TokenPayload(BaseModel):
    """JWT token payload"""
    sub: str
    role: str
    brand_id: Optional[str] = None
    exp: datetime


class CurrentUser(BaseModel):
    """Current authenticated user context"""
    id: UUID
    email: str
    phone: str
    name: Optional[str]
    role: UserRole
    is_active: bool
    is_verified: bool
    brand_id: Optional[UUID] = None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash password"""
    return pwd_context.hash(password)


def create_access_token(
    user_id: UUID,
    role: UserRole,
    brand_id: Optional[UUID] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT access token"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "sub": str(user_id),
        "role": role.value,
        "exp": expire,
    }
    
    if brand_id:
        payload["brand_id"] = str(brand_id)
    
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[TokenPayload]:
    """
    Decode and validate JWT token with strict error handling
    
    Raises:
        HTTPException: For expired or invalid tokens
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return TokenPayload(
            sub=payload["sub"],
            role=payload["role"],
            brand_id=payload.get("brand_id"),
            exp=datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        )
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"}
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> CurrentUser:
    """
    Get current authenticated user from JWT token
    
    Raises:
        HTTPException: If authentication fails
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token_data = decode_token(credentials.credentials)
    
    result = await db.execute(
        select(User).where(User.id == UUID(token_data.sub))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    
    return CurrentUser(
        id=user.id,
        email=user.email,
        phone=user.phone,
        name=getattr(user, 'name', None),
        role=user.role,
        is_active=user.is_active,
        is_verified=getattr(user, 'is_verified', True),
        brand_id=getattr(user, 'brand_id', None)
    )


async def get_current_brand_user(
    current_user: CurrentUser = Depends(get_current_user)
) -> CurrentUser:
    """Get current user ensuring they are brand role"""
    if current_user.role != UserRole.BRAND:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brand access required"
        )
    
    if not current_user.brand_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brand ID not found"
        )
    
    return current_user


async def get_current_admin(
    current_user: CurrentUser = Depends(get_current_user)
) -> CurrentUser:
    """Get current user ensuring they are admin"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_role(*allowed_roles: UserRole):
    """Dependency factory for role-based access control"""
    async def role_checker(current_user: CurrentUser = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {', '.join(r.value for r in allowed_roles)}"
            )
        return current_user
    return role_checker
