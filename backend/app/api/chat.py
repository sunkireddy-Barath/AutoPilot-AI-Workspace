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
    
    if ws_event_type:
        event = WSEvent(
            event=ws_event_type,
            data=data.get("activity") or data.get("task") or data.get("data"),
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
            print(f"Error saving user message: {e}")

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
            autonomous_mode=request.autonomous_mode,
        )
    except Exception as exc:
        await manager.broadcast(conversation_id, WSEvent(
            event=WSEventType.ERROR,
            data={"error": str(exc)},
            conversation_id=conversation_id,
        ))
        raise HTTPException(status_code=500, detail=f"Agent pipeline error: {exc}")

    # 5. Persist all generated tasks
    saved_tasks = []
    if supabase_admin:
        for task in final_state.get("tasks", []):
            task_row = {
                "id": task["id"],
                "user_id": user_id,
                "conversation_id": conversation_id,
                "title": task["title"],
                "description": task["description"],
                "status": task.get("status", "pending"),
                "priority": task.get("priority", "medium"),
                "assigned_agent": task.get("assigned_agent"),
                "progress": 0,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            try:
                result = supabase_admin.table("tasks").insert(task_row).execute()
                if result.data:
                    saved_tasks.append(result.data[0])
                    # Broadcast each new task
                    await manager.broadcast(conversation_id, WSEvent(
                        event=WSEventType.TASK_CREATED,
                        data=result.data[0],
                        conversation_id=conversation_id,
                    ))
            except Exception:
                continue  # skip duplicates
    else:
        # Demo mode: return in-memory tasks
        saved_tasks = final_state.get("tasks", [])

    # 6. Persist all agent activities
    if supabase_admin:
        for activity in final_state.get("agent_activities", []):
            try:
                supabase_admin.table("agent_activities").insert({
                    "id": activity["id"],
                    "agent_role": activity["agent_role"],
                    "action": activity["action"],
                    "detail": activity["detail"],
                    "status": activity["status"],
                    "conversation_id": conversation_id,
                    "metadata": {},
                    "timestamp": activity["timestamp"],
                }).execute()
                await manager.broadcast(conversation_id, WSEvent(
                    event=WSEventType.AGENT_ACTIVITY,
                    data=activity,
                    conversation_id=conversation_id,
                ))
            except Exception:
                continue
    else:
        # Demo mode: broadcast activities only
        for activity in final_state.get("agent_activities", []):
            await manager.broadcast(conversation_id, WSEvent(
                event=WSEventType.AGENT_ACTIVITY,
                data=activity,
                conversation_id=conversation_id,
            ))

    # 7. Save the synthesized assistant response
    combined_response = _build_chat_response(final_state)
    assistant_msg = {
        "id": str(uuid4()),
        "conversation_id": conversation_id,
        "role": "assistant",
        "content": combined_response,
        "agent_role": "orchestrator",
        "metadata": {
            "task_count": len(saved_tasks),
            "agent_messages": final_state.get("agent_messages", []),
        },
        "created_at": datetime.utcnow().isoformat(),
    }
    if supabase_admin:
        try:
            supabase_admin.table("messages").insert(assistant_msg).execute()
            # 8. Update conversation updated_at
            supabase_admin.table("conversations").update(
                {"updated_at": datetime.utcnow().isoformat()}
            ).eq("id", conversation_id).execute()
        except Exception:
            pass

    # 9. Broadcast workflow update and stream_done
    await manager.broadcast(conversation_id, WSEvent(
        event=WSEventType.WORKFLOW_UPDATED,
        data={
            "nodes": final_state.get("workflow_nodes", []),
            "edges": final_state.get("workflow_edges", []),
        },
        conversation_id=conversation_id,
    ))

    await manager.broadcast(conversation_id, WSEvent(
        event=WSEventType.STREAM_DONE,
        data={
            "message_id": assistant_msg["id"],
            "task_count": len(saved_tasks),
        },
        conversation_id=conversation_id,
    ))

    return {
        "message": assistant_msg,
        "tasks": saved_tasks,
        "workflow_nodes": final_state.get("workflow_nodes", []),
        "workflow_edges": final_state.get("workflow_edges", []),
        "agent_activities": final_state.get("agent_activities", []),
        "agent_messages": final_state.get("agent_messages", []),
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
    pm_summary = state.get("pm_response", "")[:800]

    lines = [
        "## 🚀 MeDo — Plan Generated\n",
        pm_summary,
        f"\n\n---\n**✅ {task_count} tasks created** across Product, Development, Marketing, and Analytics.\n",
        "\n**Agents activated:** 🎯 PM · 💻 Developer · 📣 Marketing · 📊 Analyst",
    ]
    return "".join(lines)
