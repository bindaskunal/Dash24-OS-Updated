"""
Dash24 V1 - Rate Limiting Middleware
In-memory rate limiting for critical endpoints
"""
import time
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.request_counts: Dict[str, Dict[str, Tuple[int, float]]] = defaultdict(lambda: defaultdict(lambda: (0, 0.0)))
        self.rate_limits = {
            "/api/auth": (5, 60),
            "/api/payments/verify": (10, 60),
            "/api/fulfillment/webhook": (20, 60)
        }
    
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        limit_config = None
        for prefix, config in self.rate_limits.items():
            if path.startswith(prefix):
                limit_config = config
                break
        
        if limit_config:
            max_requests, window_seconds = limit_config
            client_ip = self._get_client_ip(request)
            
            current_time = time.time()
            count, window_start = self.request_counts[client_ip][path]
            
            if current_time - window_start > window_seconds:
                self.request_counts[client_ip][path] = (1, current_time)
            else:
                if count >= max_requests:
                    logger.warning(
                        f"Rate limit exceeded for {client_ip} on {path}",
                        extra={"client_ip": client_ip, "path": path}
                    )
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Too many requests"
                    )
                self.request_counts[client_ip][path] = (count + 1, window_start)
        
        response = await call_next(request)
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
