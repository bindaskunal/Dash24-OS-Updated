from fastapi import FastAPI
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

from app.database import engine, Base
from app.redis_client import close_redis
from app.core.exceptions import register_exception_handlers
from app.models import *

# Routers
from app.routers.orders import router as orders_router
from app.routers.webhooks import router as webhooks_router
from app.routers.brand_analytics import router as brand_analytics_router
from app.routers.auth import router as auth_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI(title="Dash24 V1 - Bangalore Pilot")

# Register exception handlers
register_exception_handlers(app)

# Include routers
app.include_router(orders_router)
app.include_router(webhooks_router)
app.include_router(brand_analytics_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.get("/")
async def root():
    return {"message": "Dash24 V1 API Running"}

@app.on_event("startup")
async def startup_event():
    # Create tables if not present (temporary until Alembic)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("REGISTERED TABLES:", list(Base.metadata.tables.keys()))

@app.on_event("shutdown")
async def shutdown_event():
    await close_redis()
