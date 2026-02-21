import json
import os
import logging
from sqlalchemy.orm import declarative_base # <--- Add this import

logger = logging.getLogger(__name__)

# Re-add this so your models (User, Order) don't crash on import
Base = declarative_base() # <--- Add this line

# ... keep the rest of your get_db() logic below ...
async def get_db():
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
    pass

async def check_db_health() -> bool:
    return True
