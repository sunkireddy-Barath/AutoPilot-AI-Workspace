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
from app.api.chat import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown events."""
    print("🚀 MeDo Master Orchestrator API starting up...")
    yield
    print("🛑 MeDo Master Orchestrator API shutting down...")


app = FastAPI(
    title="MeDo Master Orchestrator",
    description=(
        "The core intelligence of MeDo — coordinates multi-agent workflows "
        "and autonomous project execution."
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
app.include_router(chat_router)  # chat + WebSocket (no prefix — /ws/{id} lives at root)
