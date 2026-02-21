import json
import os
import logging

logger = logging.getLogger(__name__)

# This replaces the complex SQLAlchemy engine
async def get_db():
    """
    Bypasses Neon and reads from our catalog.json.
    This ensures the backend always matches your frontend demo data.
    """
    catalog_path = os.path.join(os.getcwd(), "catalog.json")
    
    try:
        if os.path.exists(catalog_path):
            with open(catalog_path, "r") as f:
                data = json.load(f)
                # We yield the data so the routers can use it immediately
                yield data
        else:
            logger.warning(f"catalog.json not found at {catalog_path}. Returning empty list.")
            yield []
    except Exception as e:
        logger.error(f"Error reading catalog: {e}")
        yield []

# Keep these empty functions so other files importing them don't crash
async def init_db():
    pass

async def check_db_health() -> bool:
    return True
