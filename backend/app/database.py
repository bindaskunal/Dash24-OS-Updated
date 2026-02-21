import json
import os
import logging
from sqlalchemy.orm import declarative_base

logger = logging.getLogger(__name__)

# 1. Base is needed for Models
Base = declarative_base()

# 2. We create "Dummies" for Engine and SessionMaker 
# so other files can import them without crashing.
class MockObject:
    def __getattr__(self, name):
        return None
    def __call__(self, *args, **kwargs):
        return self

engine = MockObject()
async_session_maker = MockObject()

# 3. Your new JSON-based data source
async def get_db():
    """Bypasses Neon and reads from catalog.json"""
    catalog_path = os.path.join(os.getcwd(), "catalog.json")
    try:
        if os.path.exists(catalog_path):
            with open(catalog_path, "r") as f:
                data = json.load(f)
                yield data
        else:
            logger.warning(f"catalog.json not found at {catalog_path}")
            yield []
    except Exception as e:
        logger.error(f"Error in mock get_db: {e}")
        yield []

async def init_db():
    """Does nothing, but prevents 'import' errors"""
    pass

async def check_db_health() -> bool:
    """Always green for the demo"""
    return True
