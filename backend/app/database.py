"""
Dash24 V1 - Database Configuration
PostgreSQL with SQLAlchemy Async
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_tk0FumpVDJw7@ep-quiet-frost-a1ar67af-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL logging
    pool_size=5,
    max_overflow=10
)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base for models
Base = declarative_base()


async def get_db():
    """Dependency for getting database sessions"""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
