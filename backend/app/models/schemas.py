"""
Pydantic models for all core domain entities.
These are used both for API request/response validation
and as type contracts throughout the backend.
"""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Any, Dict
from datetime import datetime
from uuid import UUID, uuid4
from enum import Enum


# ─────────────────────────────────────────────
#  Enumerations
# ─────────────────────────────────────────────

class AgentRole(str, Enum):
    PRODUCT_MANAGER = "product_manager"
    DEVELOPER = "developer"
    MARKETING = "marketing"
    ANALYST = "analyst"
    ORCHESTRATOR = "orchestrator"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class WorkflowStatus(str, Enum):
    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    AGENT = "agent"


# ─────────────────────────────────────────────
#  Chat / Conversation Models
# ─────────────────────────────────────────────

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    conversation_id: str
    role: MessageRole
    content: str
    agent_role: Optional[AgentRole] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ConversationCreate(BaseModel):
    title: str
    user_id: str


class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ─────────────────────────────────────────────
#  Chat Request / Response
# ─────────────────────────────────────────────

class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    user_id: str
    autonomous_mode: bool = False


class ChatResponse(BaseModel):
    conversation_id: str
    message: ChatMessage
    tasks_generated: List["Task"] = []
    workflow_nodes: List[Dict[str, Any]] = []
    agent_activities: List["AgentActivity"] = []


# ─────────────────────────────────────────────
#  Task Models
# ─────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: str
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_agent: Optional[AgentRole] = None
    workflow_id: Optional[str] = None
    conversation_id: Optional[str] = None
    user_id: str


class Task(TaskCreate):
    id: str = Field(default_factory=lambda: str(uuid4()))
    progress: int = Field(default=0, ge=0, le=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    progress: Optional[int] = None
    assigned_agent: Optional[AgentRole] = None


# ─────────────────────────────────────────────
#  Workflow Models
# ─────────────────────────────────────────────

class WorkflowNode(BaseModel):
    id: str
    type: str  # "agent" | "task" | "trigger" | "action"
    label: str
    agent_role: Optional[AgentRole] = None
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0, "y": 0})
    data: Dict[str, Any] = Field(default_factory=dict)


class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    animated: bool = False


class WorkflowCreate(BaseModel):
    title: str
    description: str
    user_id: str
    conversation_id: Optional[str] = None
    nodes: List[WorkflowNode] = []
    edges: List[WorkflowEdge] = []


class Workflow(WorkflowCreate):
    id: str = Field(default_factory=lambda: str(uuid4()))
    status: WorkflowStatus = WorkflowStatus.DRAFT
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ─────────────────────────────────────────────
#  Agent Activity / Log Models
# ─────────────────────────────────────────────

class AgentActivity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    agent_role: AgentRole
    action: str
    detail: str
    status: Literal["thinking", "active", "completed", "error"] = "active"
    conversation_id: Optional[str] = None
    workflow_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ─────────────────────────────────────────────
#  WebSocket Event Models
# ─────────────────────────────────────────────

class WSEventType(str, Enum):
    AGENT_THINKING = "agent_thinking"
    AGENT_MESSAGE = "agent_message"
    TASK_CREATED = "task_created"
    TASK_UPDATED = "task_updated"
    WORKFLOW_UPDATED = "workflow_updated"
    AGENT_ACTIVITY = "agent_activity"
    STREAM_CHUNK = "stream_chunk"
    STREAM_DONE = "stream_done"
    ERROR = "error"


class WSEvent(BaseModel):
    event: WSEventType
    data: Any
    conversation_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
