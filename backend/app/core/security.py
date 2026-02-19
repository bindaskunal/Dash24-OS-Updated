"""
Dash24 V1 - JWT Authentication & Security
Phase 0 Foundation: Proper auth with get_current_user, get_current_brand
"""
import os
from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, Brand
from app.models.enums import UserRole

# Configuration from environment
JWT_SECRET = os.environ.get("JWT_SECRET", "dash24-v1-secret-change-in-production")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRY_HOURS = int(os.environ.get("JWT_EXPIRY_HOURS", 24))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bearer token extraction
security = HTTPBearer(auto_error=False)


class TokenPayload(BaseModel):
    """JWT token payload"""
    sub: str  # user_id
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
        expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)
    
    payload = {
        "sub": str(user_id),
        "role": role.value,
        "exp": expire,
    }
    
    if brand_id:
        payload["brand_id"] = str(brand_id)
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[TokenPayload]:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return TokenPayload(
            sub=payload["sub"],
            role=payload["role"],
            brand_id=payload.get("brand_id"),
            exp=datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        )
    except JWTError:
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> CurrentUser:
    """
    Extract and validate current user from JWT token.
    Raises 401 if not authenticated.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not credentials:
        raise credentials_exception
    
    token_payload = decode_token(credentials.credentials)
    if not token_payload:
        raise credentials_exception
    
    # Check expiration
    if token_payload.exp < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Fetch user from database
    try:
        user_id = UUID(token_payload.sub)
    except ValueError:
        raise credentials_exception
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    # Parse brand_id if present
    brand_id = None
    if token_payload.brand_id:
        try:
            brand_id = UUID(token_payload.brand_id)
        except ValueError:
            pass
    
    return CurrentUser(
        id=user.id,
        email=user.email,
        phone=user.phone,
        name=user.name,
        role=UserRole(token_payload.role),
        is_active=user.is_active,
        is_verified=user.is_verified,
        brand_id=brand_id
    )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[CurrentUser]:
    """
    Extract current user from JWT if present.
    Returns None if not authenticated (for optional auth routes).
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


async def get_current_brand(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Brand:
    """
    Get brand for authenticated brand user.
    Raises 403 if user is not a brand user or brand not found.
    """
    if current_user.role != UserRole.BRAND:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brand access required"
        )
    
    if not current_user.brand_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No brand associated with this user"
        )
    
    result = await db.execute(
        select(Brand).where(Brand.id == current_user.brand_id)
    )
    brand = result.scalar_one_or_none()
    
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )
    
    if not brand.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brand is inactive"
        )
    
    return brand


def require_role(*allowed_roles: UserRole):
    """
    Dependency factory for role-based access control.
    
    Usage:
        @router.get("/admin-only")
        async def admin_route(user: CurrentUser = Depends(require_role(UserRole.ADMIN))):
            ...
    """
    async def role_checker(
        current_user: CurrentUser = Depends(get_current_user)
    ) -> CurrentUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}"
            )
        return current_user
    
    return role_checker


def require_admin():
    """Shorthand for admin-only routes"""
    return require_role(UserRole.ADMIN)


def require_brand():
    """Shorthand for brand-only routes"""
    return require_role(UserRole.BRAND)


def require_customer_or_admin():
    """Shorthand for customer or admin routes"""
    return require_role(UserRole.CUSTOMER, UserRole.ADMIN)
