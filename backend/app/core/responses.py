"""
Dash24 V1 - Standardized API Responses
Phase 0 Foundation: Consistent response format across all endpoints
"""
from typing import Any, Optional, TypeVar, Generic
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """
    Standard API response wrapper.
    
    All endpoints return:
    {
        "success": true/false,
        "data": {...} or null,
        "error": null or "error message"
    }
    """
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None


class PaginatedData(BaseModel, Generic[T]):
    """Paginated response data"""
    items: list
    total: int
    limit: int
    offset: int
    has_more: bool


def success_response(data: Any = None) -> dict:
    """Create success response"""
    return {
        "success": True,
        "data": data,
        "error": None
    }


def error_response(message: str, data: Any = None) -> dict:
    """Create error response"""
    return {
        "success": False,
        "data": data,
        "error": message
    }


def paginated_response(
    items: list,
    total: int,
    limit: int,
    offset: int
) -> dict:
    """Create paginated success response"""
    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + len(items) < total
        },
        "error": None
    }
