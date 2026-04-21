"""
Health check and root endpoints — used by deployment platforms
to verify the backend is alive.
"""

from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/", tags=["root"])
async def root():
    return {
        "service": "AutoPilot AI Workspace",
        "version": "1.0.0",
        "status": "running",
    }


@router.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "AutoPilot AI Workspace API",
    }
