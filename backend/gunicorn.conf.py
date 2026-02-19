"""
Gunicorn configuration for Dash24 V1 production deployment
"""
import os
import multiprocessing

bind = f"0.0.0.0:{os.environ.get('PORT', '8001')}"

workers = int(os.environ.get("GUNICORN_WORKERS", (2 * multiprocessing.cpu_count()) + 1))

worker_class = "uvicorn.workers.UvicornWorker"

timeout = int(os.environ.get("GUNICORN_TIMEOUT", "60"))

keepalive = int(os.environ.get("GUNICORN_KEEPALIVE", "5"))

reload = False

preload_app = True

max_requests = int(os.environ.get("GUNICORN_MAX_REQUESTS", "1000"))

max_requests_jitter = int(os.environ.get("GUNICORN_MAX_REQUESTS_JITTER", "50"))

accesslog = "-"

errorlog = "-"

loglevel = os.environ.get("GUNICORN_LOG_LEVEL", "info").lower()

capture_output = True

enable_stdio_inheritance = True
