"""
Dash24 V1 - Request ID Middleware
Adds unique request ID to each request for tracing
"""
import uuid
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        old_factory = logging.getLogRecordFactory()
        
        def record_factory(*args, **kwargs):
            record = old_factory(*args, **kwargs)
            record.request_id = request_id
            return record
        
        logging.setLogRecordFactory(record_factory)
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        logging.setLogRecordFactory(old_factory)
        
        return response
