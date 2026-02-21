from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import logging
import sys

from app.core.settings import settings
from app.redis_client import close_redis
from app.core.exceptions import register_exception_handlers
from app.middleware import RateLimitMiddleware, RequestIDMiddleware

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
# FastAPI App
# -------------------------

docs_url = "/docs" if (settings.DEBUG or settings.ENABLE_DOCS) else None
redoc_url = "/redoc" if (settings.DEBUG or settings.ENABLE_DOCS) else None

app = FastAPI(
    title="Dash24 V1 - Bangalore Pilot",
    debug=True,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(RequestIDMiddleware)
app.add_middleware(RateLimitMiddleware)

register_exception_handlers(app)

app.include_router(auth_router)
app.include_router(orders_router)
app.include_router(payments_router)
app.include_router(fulfillment_router)
app.include_router(dashboard_router)
app.include_router(webhooks_router)
app.include_router(brand_analytics_router)


# -------------------------
# CORS
# -------------------------

if settings.ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    logger.warning("CORS middleware not configured - ALLOWED_ORIGINS is empty")


# -------------------------
# Basic Routes
# -------------------------
@app.get("/api/products")
async def get_all_products():
    import json
    import os
    catalog_path = os.path.join(os.getcwd(), "catalog.json")
    if os.path.exists(catalog_path):
        with open(catalog_path, "r") as f:
            return json.load(f)
    return {"error": "catalog.json not found"}
@app.get("/")
async def root():
    return {"message": "Dash24 V1 API Running"}


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "note": "Database temporarily disabled for debugging"
    }


# -------------------------
# Startup / Shutdown
# -------------------------

@app.on_event("startup")
async def startup_event():
    # Make sure all lines below have exactly 4 spaces of indentation
    logger.info("Starting Dash24 V1 API (Sync Mode: Catalog JSON)")
    logger.info(f"Debug mode: {settings.DEBUG}")  # This was line 101
    logger.info(f"Docs enabled: {settings.DEBUG or settings.ENABLE_DOCS}")
    logger.info(f"Log level: {settings.LOG_LEVEL}")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Dash24 V1 API")
    await close_redis()
    
