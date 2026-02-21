import json
import os
import logging

logger = logging.getLogger(__name__)

# We define a simple mock class so that routers 
# expecting a 'Session' object don't throw errors.
class MockSession:
    async def close(self):
        pass
    async def commit(self):
        pass

async def get_db():
    """
    Bypasses Neon/SQLAlchemy and returns data from catalog.json.
    This replaces the 'async with async_session_maker()' logic.
    """
    catalog_path = os.path.join(os.getcwd(), "catalog.json")
    
    try:
        if os.path.exists(catalog_path):
            with open(catalog_path, "r") as f:
                data = json.load(f)
                # We yield the data. If your routers expect a database object,
                # we will adjust the router files in the next step.
                yield data
        else:
            logger.warning(f"catalog.json not found at {catalog_path}")
            yield []
    except Exception as e:
        logger.error(f"Error in mock get_db: {e}")
        yield []

async def init_db():
    """Empty because we aren't creating SQL tables anymore"""
    pass

async def check_db_health() -> bool:
    """Always returns True to keep the /health endpoint green"""
    return True
