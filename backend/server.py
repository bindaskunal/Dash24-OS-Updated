from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import logging
import sys
import json
import os

from app.core.settings import settings
from app.redis_client import close_redis
from app.core.exceptions import register_exception_handlers
from app.middleware import RateLimitMiddleware, RequestIDMiddleware

# Router Imports
from app.routers.orders import router as orders_router
from app.routers.webhooks import router as webhooks_router
from app.routers.brand_analytics import router as brand_analytics_router
from app.routers.auth import router as auth_router
from app.routers.payments import router as payments_router
from app.routers.fulfillment import router as fulfillment_router
from app.routers.dashboard import router as dashboard_router

# -------------------------
# Logging Configuration
# -------------------------
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# -------------------------
# FastAPI App Initialization
# -------------------------
# Force docs to be visible for the demo
app = FastAPI(
    title="Dash24 V1 - Bangalore Pilot",
    debug=True,
    docs_url="/docs",
    redoc_url="/redoc"
)

# -------------------------
# Middleware
# -------------------------
app.add_middleware(RequestIDMiddleware)
app.add_middleware(RateLimitMiddleware)

# CORS: Configured to allow your local frontend to talk to Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

# -------------------------
# Routers
# -------------------------
app.include_router(auth_router)
app.include_router(orders_router)
app.include_router(payments_router)
app.include_router(fulfillment_router)
app.include_router(dashboard_router)
app.include_router(webhooks_router)
app.include_router(brand_analytics_router)

# -------------------------
# Production Routes (Catalog Sync)
# -------------------------

@app.get("/api/products")
async def get_products():
    """Serves the synced product list for the frontend demo"""
    catalog_path = os.path.join(os.getcwd(), "catalog.json")
    try:
        if os.path.exists(catalog_path):
            with open(catalog_path, "r") as f:
                return json.load(f)
        logger.error(f"catalog.json missing at {catalog_path}")
        return []
    except Exception as e:
        logger.error(f"Catalog error: {e}")
        return {"error": str(e)}

@app.get("/")
async def root():
    return {"message": "Dash24 V1 API Running (Sync Mode)"}

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "mode": "json_sync",
        "database": "mocked"
    }

# -------------------------
# Startup / Shutdown
# -------------------------

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Dash24 V1 API (Sync Mode: Catalog JSON)")
    logger.info(f"Log level: {settings.LOG_LEVEL}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Dash24 V1 API")
    await close_redis()
