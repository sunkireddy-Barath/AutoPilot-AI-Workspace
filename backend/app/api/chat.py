"""
Chat API + WebSocket endpoint — the main interface between the frontend
and the multi-agent LangGraph pipeline.

REST endpoint: POST /api/v1/chat
WebSocket:     ws://host/ws/{conversation_id}

The WebSocket streams agent events in real-time:
- agent_thinking: agent started processing
- agent_message: full agent response
- task_created: new task from agent
- workflow_updated: new React Flow graph
- stream_done: all agents finished
"""

import json
import asyncio
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from datetime import datetime
from uuid import uuid4

from app.models.schemas import (
    ChatRequest, WSEvent, WSEventType, MessageRole,
    AgentRole, TaskCreate, TaskPriority, TaskStatus
)
from app.orchestrator.langgraph_engine import MeDoOrchestrator
from app.db.supabase_client import supabase_admin
from app.utils.events import global_bus

router = APIRouter(tags=["chat"])

# ── Singleton orchestrator (shared across requests) ────────────────────
orchestrator = MeDoOrchestrator()

# ── WebSocket connection manager ───────────────────────────────────────
class ConnectionManager:
    """Manages active WebSocket connections keyed by conversation_id."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, conversation_id: str, websocket: WebSocket):
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = set()
        self.active_connections[conversation_id].add(websocket)

    def disconnect(self, conversation_id: str, websocket: WebSocket):
        if conversation_id in self.active_connections:
            self.active_connections[conversation_id].discard(websocket)
            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]

    async def broadcast(self, conversation_id: str, event: WSEvent):
        """Broadcast an event to all WebSocket connections for a conversation."""
        if conversation_id not in self.active_connections:
            return
        payload = event.model_dump_json()
        disconnected = set()
        for ws in self.active_connections[conversation_id]:
            try:
                await ws.send_text(payload)
            except Exception:
                disconnected.add(ws)
        for ws in disconnected:
            self.active_connections[conversation_id].discard(ws)


manager = ConnectionManager()

# ── Event Bus Subscription ─────────────────────────────────────────────

async def on_bus_event(event_type: str, data: dict):
    """
    Called when the orchestrator emits an event.
    Automatically wraps it in a WSEvent and broadcasts it.
    """
    conversation_id = data.get("conversation_id")
    if not conversation_id:
        return

    ws_event_type = None
    if event_type == "agent_activity":
        ws_event_type = WSEventType.AGENT_ACTIVITY
    elif event_type == "task_created":
        ws_event_type = WSEventType.TASK_CREATED
    elif event_type == "agent_thinking":
        ws_event_type = WSEventType.AGENT_THINKING
    elif event_type == "agent_message":
        ws_event_type = WSEventType.AGENT_MESSAGE
    elif event_type == "workflow_updated":
        ws_event_type = WSEventType.WORKFLOW_UPDATED
    
    if ws_event_type:
        # PERSIST: If it's an agent message, save it to the database so it stays in chat
        if event_type == "agent_message":
            msg_data = {
                "id": data.get("id") or str(uuid4()),
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": data.get("content"),
                "agent_role": data.get("agent_role"),
                "metadata": data.get("metadata") or {},
                "created_at": data.get("created_at") or datetime.utcnow().isoformat(),
            }
            if supabase_admin:
                try:
                    supabase_admin.table("messages").insert(msg_data).execute()
                except Exception as e:
                    print(f"❌ Supabase Persistence Error (Agent Message): {e}")
                    if hasattr(e, 'message'): print(f"Detail: {e.message}")

        # PERSIST: Tasks
        elif event_type == "task_created" and supabase_admin:
            task = data.get("task")
            if task:
                try:
                    supabase_admin.table("tasks").insert(task).execute()
                except Exception as e:
                    print(f"❌ Supabase Persistence Error (Task): {e}")

        # PERSIST: Activities
        elif event_type == "agent_activity" and supabase_admin:
            activity = data.get("activity")
            if activity:
                try:
                    supabase_admin.table("agent_activities").insert(activity).execute()
                except Exception as e:
                    print(f"❌ Supabase Persistence Error (Activity): {e}")

        # Use the whole data object for agent_message to preserve all fields (id, agent_role, content)
        event_payload = data
        if event_type == "agent_activity":
            event_payload = data.get("activity")
        elif event_type == "task_created":
            event_payload = data.get("task")
        elif event_type == "agent_thinking":
            event_payload = data.get("data")
        elif event_type == "workflow_updated":
            event_payload = data.get("data")

        event = WSEvent(
            event=ws_event_type,
            data=event_payload,
            conversation_id=conversation_id
        )
        await manager.broadcast(conversation_id, event)

# Start subscription
global_bus.subscribe(on_bus_event)


# ── REST Chat Endpoint ────────────────────────────────────────────────

@router.post("/api/v1/chat", response_model=dict)
async def chat(request: ChatRequest):
    """
    Main chat endpoint. Receives user message, runs the multi-agent pipeline,
    persists everything to Supabase, and returns the full result.

    WebSocket clients receive real-time updates during processing.
    """
    conversation_id = request.conversation_id
    user_id = request.user_id

    # 0. Ensure conversation exists (Upsert)
    if supabase_admin:
        try:
            supabase_admin.table("conversations").upsert({
                "id": conversation_id,
                "user_id": user_id,
                "title": request.message[:50] + "...",
                "updated_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            print(f"❌ Supabase Persistence Error (Upsert Conversation): {e}")

    # 1. Save user message to Supabase
    user_msg = {
        "id": str(uuid4()),
        "conversation_id": conversation_id,
        "role": "user",
        "content": request.message,
        "metadata": {},
        "created_at": datetime.utcnow().isoformat(),
    }
    if supabase_admin:
        try:
            supabase_admin.table("messages").insert(user_msg).execute()
        except Exception as e:
            print(f"❌ Supabase Persistence Error (User Message): {e}")

    # 0.5 Ensure workflow exists (Initial Draft)
    workflow_id = str(uuid4())
    if supabase_admin:
        try:
            supabase_admin.table("workflows").insert({
                "id": workflow_id,
                "user_id": user_id,
                "conversation_id": conversation_id,
                "title": f"Blueprint: {request.message[:40]}...",
                "status": "running",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }).execute()
        except Exception as e:
            print(f"❌ Supabase Persistence Error (Initial Workflow): {e}")

    # 2. Broadcast: user message received, agents starting
    await manager.broadcast(conversation_id, WSEvent(
        event=WSEventType.AGENT_THINKING,
        data={"message": "🤖 MeDo analyzing your goal...", "agent": "orchestrator"},
        conversation_id=conversation_id,
    ))

    # 3. Load conversation history
    history = []
    if supabase_admin:
        try:
            history_result = (
                supabase_admin.table("messages")
                .select("role, content, agent_role")
                .eq("conversation_id", conversation_id)
                .order("created_at")
                .limit(20)
                .execute()
            )
            history = [
                {"role": m["role"], "content": m["content"]}
                for m in (history_result.data or [])
                if m.get("id") != user_msg["id"]
            ]
        except Exception as e:
            print(f"Error loading history: {e}")

    # 4. Run the multi-agent LangGraph pipeline
    try:
        final_state = await orchestrator.run(
            user_goal=request.message,
            conversation_id=conversation_id,
            user_id=user_id,
            history=history,
            autonomous=request.autonomous_mode,
            workflow_id=workflow_id,
        )
    except Exception as exc:
        await manager.broadcast(conversation_id, WSEvent(
            event=WSEventType.ERROR,
            data={"error": str(exc)},
            conversation_id=conversation_id,
        ))
        raise HTTPException(status_code=500, detail=f"Agent pipeline error: {exc}")

    # 5. Finalize the workflow graph
    if supabase_admin and workflow_id:
        try:
            supabase_admin.table("workflows").update({
                "nodes": final_state.get("workflow_nodes", []),
                "edges": final_state.get("workflow_edges", []),
                "status": "completed",
                "updated_at": datetime.utcnow().isoformat(),
            }).eq("id", workflow_id).execute()
        except Exception as e:
            print(f"❌ Supabase Persistence Error (Final Workflow): {e}")

    return {
        "status": "success",
        "conversation_id": conversation_id,
        "workflow_id": workflow_id,
        "tasks": final_state.get("tasks", []),
        "workflow_nodes": final_state.get("workflow_nodes", []),
        "workflow_edges": final_state.get("workflow_edges", []),
        "agent_activities": final_state.get("agent_activities", []),
    }


# ── WebSocket Endpoint ────────────────────────────────────────────────

@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    """
    WebSocket connection per conversation.
    Frontend connects once, then receives real-time agent events
    while the REST /chat endpoint processes the user message.
    """
    await manager.connect(conversation_id, websocket)
    try:
        while True:
            # Keep connection alive, handle ping/pong
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(conversation_id, websocket)


# ── Helper ────────────────────────────────────────────────────────────

def _build_chat_response(state: dict) -> str:
    """Build the human-readable chat response shown in the UI."""
    task_count = len(state.get("tasks", []))
    pm_summary = state.get("pm_response", "")
    
    # Extract agent outputs if they are in the simulated format
    lines = [
        "## 🚀 Master Orchestration — System Plan Generated\n",
        pm_summary,
        "\n\n---\n",
        "### [Workflow]\n- Step 1: Analyze Strategic Goal\n- Step 2: Generate Planning Blueprint\n- Step 3: Design Technical Architecture\n- Step 4: Formulate Growth Strategy\n- Step 5: Validate Metrics & Risks\n",
        f"\n**✅ {task_count} tasks created** across Product, Development, Marketing, and Analytics.\n",
        "\n### [Agent Communication]\nPM → Dev: Requirement Specs Delivered\nDev → Marketing: System Capabilities Shared\nMarketing → Analyst: Growth Projections Sent\n",
        "\n### [Autonomous Improvements]\n- **Self-Optimization:** System will adjust agent temperature based on task complexity.\n- **Memory Refinement:** Historical project data will be used to improve roadmap accuracy.\n",
        "\n**Agents activated:** 🎯 PM · 💻 Developer · 📣 Marketing · ⚙️ Operations · 📊 Analyst",
    ]
    return "".join(lines)
