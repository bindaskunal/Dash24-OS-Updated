"""
Dash24 V1 - Centralized Settings
Validates all required environment variables at startup
"""
import os
import sys
from typing import List
from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self):
        self.DATABASE_URL: str = self._get_required("DATABASE_URL")
        self.JWT_SECRET_KEY: str = self._get_required("JWT_SECRET_KEY")
        self.RAZORPAY_KEY_ID: str = self._get_required("RAZORPAY_KEY_ID")
        self.RAZORPAY_KEY_SECRET: str = self._get_required("RAZORPAY_KEY_SECRET")
        self.EASYECOM_API_URL: str = self._get_required("EASYECOM_API_URL")
        self.EASYECOM_API_KEY: str = self._get_required("EASYECOM_API_KEY")
        self.EASYECOM_WEBHOOK_SECRET: str = self._get_required("EASYECOM_WEBHOOK_SECRET")
        
        self.DEBUG: bool = os.environ.get("DEBUG", "false").lower() == "true"
        self.ENABLE_DOCS: bool = os.environ.get("ENABLE_DOCS", "false").lower() == "true"
        self.LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "INFO").upper()
        
        self.ALLOWED_ORIGINS: List[str] = self._parse_origins(
            os.environ.get("ALLOWED_ORIGINS", "")
        )
        
        self.DB_POOL_SIZE: int = int(os.environ.get("DB_POOL_SIZE", "5"))
        self.DB_MAX_OVERFLOW: int = int(os.environ.get("DB_MAX_OVERFLOW", "10"))
        self.DB_POOL_TIMEOUT: int = int(os.environ.get("DB_POOL_TIMEOUT", "30"))
        
        self.REDIS_URL: str = os.environ.get("REDIS_URL", "redis://localhost:6379")
        
        self.JWT_ALGORITHM: str = os.environ.get("JWT_ALGORITHM", "HS256")
        self.ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
            os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
        )
    
    def _get_required(self, key: str) -> str:
        value = os.environ.get(key)
        if not value:
            print(f"FATAL: Required environment variable {key} is not set")
            sys.exit(1)
        return value
    
    def _parse_origins(self, origins_str: str) -> List[str]:
        if not origins_str:
            return []
        return [origin.strip() for origin in origins_str.split(",") if origin.strip()]


settings = Settings()
