"""
Dash24 V1 - Idempotency Support
Phase 0 Foundation: Prevent duplicate order creation using X-Idempotency-Key
"""
import json
import logging
from typing import Optional, Tuple
from fastapi import Header, Depends

from app.redis_client import get_redis

logger = logging.getLogger(__name__)

# Default TTL for idempotency keys (24 hours)
IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60


class IdempotencyService:
    """Service for managing idempotency keys in Redis"""
    
    def __init__(self, redis):
        self.redis = redis
        self.key_prefix = "idempotency:"
    
    def _make_key(self, idempotency_key: str) -> str:
        """Generate Redis key"""
        return f"{self.key_prefix}{idempotency_key}"
    
    async def check_and_set(
        self,
        idempotency_key: str,
        resource_type: str = "order"
    ) -> Tuple[bool, Optional[dict]]:
        """
        Check if idempotency key exists. If not, set it as "processing".
        
        Returns:
            Tuple[is_new, existing_result]:
            - (True, None) if this is a new request
            - (False, {...}) if duplicate, with existing result
        """
        key = self._make_key(idempotency_key)
        
        # Try to set NX (only if not exists)
        result = await self.redis.set(
            key,
            json.dumps({"status": "processing", "resource_type": resource_type}),
            nx=True,
            ex=IDEMPOTENCY_TTL_SECONDS
        )
        
        if result:
            # New request, key was set
            return True, None
        
        # Key exists, get existing result
        existing = await self.redis.get(key)
        if existing:
            try:
                return False, json.loads(existing)
            except json.JSONDecodeError:
                return False, {"status": "unknown"}
        
        return True, None
    
    async def set_result(
        self,
        idempotency_key: str,
        resource_id: str,
        resource_type: str = "order",
        status: str = "completed"
    ):
        """
        Set the result for an idempotency key after successful operation.
        """
        key = self._make_key(idempotency_key)
        
        await self.redis.set(
            key,
            json.dumps({
                "status": status,
                "resource_type": resource_type,
                "resource_id": resource_id
            }),
            ex=IDEMPOTENCY_TTL_SECONDS
        )
        
        logger.info(f"Idempotency key {idempotency_key} -> {resource_type}:{resource_id}")
    
    async def clear(self, idempotency_key: str):
        """Clear idempotency key (e.g., on failure)"""
        key = self._make_key(idempotency_key)
        await self.redis.delete(key)


async def get_idempotency_service(redis=Depends(get_redis)) -> IdempotencyService:
    """Dependency to get idempotency service"""
    return IdempotencyService(redis)


def get_idempotency_key(
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key")
) -> Optional[str]:
    """Extract idempotency key from header"""
    return x_idempotency_key
