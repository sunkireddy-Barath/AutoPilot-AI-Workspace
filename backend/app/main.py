"""
AutoPilot AI Workspace — FastAPI Application Entry Point

Registers all routers, configures CORS, and exposes the WebSocket
endpoint for real-time agent streaming.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.api.health import router as health_router
from app.api.tasks import router as tasks_router
from app.api.workflows import router as workflows_router
from app.api.conversations import router as conversations_router
from app.api.agents import router as agents_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown events."""
    print("🚀 AutoPilot AI Workspace API starting up...")
    yield
    print("🛑 AutoPilot AI Workspace API shutting down...")


app = FastAPI(
    title="AutoPilot AI Workspace",
    description=(
        "A multi-agent AI system that converts high-level goals into "
        "structured workflows, tasks, and automated execution plans."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─────────────────────────────────────────────
#  CORS Middleware
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
#  Routers
# ─────────────────────────────────────────────
app.include_router(health_router)
app.include_router(tasks_router, prefix="/api/v1")
app.include_router(workflows_router, prefix="/api/v1")
app.include_router(conversations_router, prefix="/api/v1")
app.include_router(agents_router, prefix="/api/v1")
