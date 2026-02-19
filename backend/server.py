from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import logging
import sys

from app.core.settings import settings
from app.database import engine, Base, check_db_health
from app.redis_client import close_redis
from app.core.exceptions import register_exception_handlers
from app.models import *
from app.middleware import RateLimitMiddleware, RequestIDMiddleware

from app.routers.orders import router as orders_router
from app.routers.webhooks import router as webhooks_router
from app.routers.brand_analytics import router as brand_analytics_router
from app.routers.auth import router as auth_router
from app.routers.payments import router as payments_router
from app.routers.fulfillment import router as fulfillment_router
from app.routers.dashboard import router as dashboard_router


logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - [%(request_id)s] - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logging.getLogRecordFactory().__defaults__ = ('',)

logger = logging.getLogger(__name__)

docs_url = "/docs" if (settings.DEBUG or settings.ENABLE_DOCS) else None
redoc_url = "/redoc" if (settings.DEBUG or settings.ENABLE_DOCS) else None

app = FastAPI(
    title="Dash24 V1 - Bangalore Pilot",
    debug=settings.DEBUG,
    docs_url=docs_url,
    redoc_url=redoc_url
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


@app.get("/")
async def root():
    return {"message": "Dash24 V1 API Running"}


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    Validates database connectivity
    """
    db_healthy = await check_db_health()
    
    if not db_healthy:
        logger.error("Health check failed: Database unreachable")
        return {"status": "unhealthy", "database": "unreachable"}, 503
    
    return {"status": "ok"}


@app.on_event("startup")
async def startup_event():
    logger.info("Starting Dash24 V1 API")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"Docs enabled: {settings.DEBUG or settings.ENABLE_DOCS}")
    logger.info(f"Log level: {settings.LOG_LEVEL}")
    logger.info(f"CORS origins: {settings.ALLOWED_ORIGINS}")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    logger.info("Database tables initialized")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Dash24 V1 API")
    await close_redis()
