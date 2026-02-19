"""
Dash24 V1 - Global Exception Handlers
Secure error handling without stack trace leaks in production
"""
import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError

from app.core.settings import settings

logger = logging.getLogger(__name__)


class AppException(Exception):
    """Base application exception"""
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        data: dict = None
    ):
        self.message = message
        self.status_code = status_code
        self.data = data
        super().__init__(self.message)


class NotFoundError(AppException):
    """Resource not found"""
    def __init__(self, resource: str, identifier: str = None):
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} '{identifier}' not found"
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)


class ValidationError(AppException):
    """Business validation error"""
    def __init__(self, message: str, data: dict = None):
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST, data=data)


class AuthenticationError(AppException):
    """Authentication failed"""
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED)


class AuthorizationError(AppException):
    """Authorization failed"""
    def __init__(self, message: str = "Access denied"):
        super().__init__(message, status_code=status.HTTP_403_FORBIDDEN)


class ConflictError(AppException):
    """Resource conflict"""
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_409_CONFLICT)


class InsufficientStockError(AppException):
    """Insufficient inventory"""
    def __init__(self, sku: str, requested: int, available: int):
        message = f"Insufficient stock for SKU '{sku}': requested {requested}, available {available}"
        super().__init__(
            message,
            status_code=status.HTTP_400_BAD_REQUEST,
            data={"sku": sku, "requested": requested, "available": available}
        )


class PaymentError(AppException):
    """Payment processing error"""
    def __init__(self, message: str, data: dict = None):
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST, data=data)


class IdempotencyError(AppException):
    """Duplicate request detected"""
    def __init__(self, idempotency_key: str, existing_resource_id: str = None):
        message = f"Duplicate request with idempotency key: {idempotency_key}"
        data = {"idempotency_key": idempotency_key}
        if existing_resource_id:
            data["existing_resource_id"] = existing_resource_id
        super().__init__(message, status_code=status.HTTP_409_CONFLICT, data=data)


def register_exception_handlers(app: FastAPI):
    """Register all exception handlers on FastAPI app"""
    
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        """Handle application-level exceptions"""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "data": exc.data,
                "error": exc.message
            }
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle Pydantic validation errors"""
        errors = []
        for error in exc.errors():
            loc = " -> ".join(str(l) for l in error["loc"])
            errors.append(f"{loc}: {error['msg']}")
        
        response_content = {
            "success": False,
            "data": None,
            "error": "; ".join(errors)
        }
        
        if settings.DEBUG:
            response_content["data"] = {"validation_errors": exc.errors()}
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=response_content
        )
    
    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
        """Handle database errors"""
        logger.error(f"Database error: {exc}", exc_info=settings.DEBUG)
        
        error_message = "Database operation failed"
        if settings.DEBUG:
            error_message = f"Database error: {str(exc)}"
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "data": None,
                "error": error_message
            }
        )
    
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        """Handle unexpected errors"""
        logger.error(f"Unexpected error: {exc}", exc_info=settings.DEBUG)
        
        error_message = "An unexpected error occurred"
        if settings.DEBUG:
            error_message = f"Error: {str(exc)}"
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "data": None,
                "error": error_message
            }
        )
