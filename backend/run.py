#!/usr/bin/env python
"""
Development server entry point.
Run with: python run.py
Or:        uvicorn app.main:app --reload --port 8000
"""
import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=(settings.app_env == "development"),
        log_level="info",
    )
