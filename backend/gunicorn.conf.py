"""
Gunicorn configuration for Dash24 V1 production deployment
"""
import os
import multiprocessing

bind = f"0.0.0.0:{os.environ['PORT']}"

workers = int(os.environ.get("GUNICORN_WORKERS", "1"))

worker_class = "uvicorn.workers.UvicornWorker"

timeout = 60
keepalive = 5

reload = False
preload_app = False

accesslog = "-"
errorlog = "-"
loglevel = "info"
