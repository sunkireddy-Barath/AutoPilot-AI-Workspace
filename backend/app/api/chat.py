"""
Chat API + WebSocket endpoint — the main interface between the frontend
and the multi-agent LangGraph pipeline.

REST endpoint: POST /api/v1/chat
WebSocket:     ws://host/ws/{conversation_id}

The REST endpoint runs the full LangGraph pipeline synchronously and
returns the complete AI response. WebSocket streams real-time agent
events during processing (when a persistent server is available).
"""

import json
import asyncio
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
from uuid import uuid4

from app.models.schemas import (
    ChatRequest, WSEvent, WSEventType,
    AgentRole, TaskPriority, TaskStatus
)
from app.orchestrator.langgraph_engine import MeDoOrchestrator
from app.db.supabase_client import supabase_admin
from app.utils.events import global_bus
from app.utils.auth_utils import to_uuid

router = APIRouter(tags=["chat"])

# ── Singleton orchestrator ─────────────────────────────────────────────
orchestrator = MeDoOrchestrator()


# ── WebSocket connection manager ───────────────────────────────────────
class ConnectionManager:
    """Manages active WebSocket connections keyed by conversation_id."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, conversation_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(conversation_id, set()).add(websocket)

    def disconnect(self, conversation_id: str, websocket: WebSocket):
        if conversation_id in self.active_connections:
            self.active_connections[conversation_id].discard(websocket)
            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]

    async def broadcast(self, conversation_id: str, event: WSEvent):
        connections = self.active_connections.get(conversation_id, set())
        if not connections:
            return
        payload = event.model_dump_json()
        dead: Set[WebSocket] = set()
        for ws in connections:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.add(ws)
        for ws in dead:
            connections.discard(ws)


manager = ConnectionManager()


# ── Event Bus → WebSocket bridge ───────────────────────────────────────

async def on_bus_event(event_type: str, data: dict):
    """
    Routes orchestrator events to connected WebSocket clients.
    Also persists agent messages, tasks, and activities to Supabase.
    """
    conversation_id = data.get("conversation_id")
    if not conversation_id:
        return

    _type_map = {
        "agent_activity": WSEventType.AGENT_ACTIVITY,
        "task_created":   WSEventType.TASK_CREATED,
        "agent_thinking": WSEventType.AGENT_THINKING,
        "agent_message":  WSEventType.AGENT_MESSAGE,
        "workflow_updated": WSEventType.WORKFLOW_UPDATED,
        "agent_collaboration": WSEventType.AGENT_ACTIVITY,
    }
    ws_event_type = _type_map.get(event_type)
    if not ws_event_type:
        return

    # ── Persist to Supabase ──────────────────────────────────────────
    if supabase_admin:
        if event_type == "agent_message":
            msg = {
                "id": data.get("id") or str(uuid4()),
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": data.get("content"),
                "agent_role": data.get("agent_role"),
                "metadata": data.get("metadata") or {},
                "created_at": data.get("created_at") or datetime.utcnow().isoformat(),
            }
            try:
                supabase_admin.table("messages").insert(msg).execute()
            except Exception as e:
                print(f"[Supabase] agent_message persist error: {e}")

        elif event_type == "task_created":
            task = data.get("task")
            if task:
                try:
                    supabase_admin.table("tasks").insert(task).execute()
                except Exception as e:
                    print(f"[Supabase] task persist error: {e}")

        elif event_type == "agent_activity":
            activity = data.get("activity")
            if activity:
                try:
                    supabase_admin.table("agent_activities").insert(activity).execute()
                except Exception as e:
                    print(f"[Supabase] activity persist error: {e}")

    # ── Determine event payload ──────────────────────────────────────
    payload_map = {
        "agent_activity": data.get("activity"),
        "task_created":   data.get("task"),
        "agent_thinking": data.get("data"),
        "workflow_updated": data.get("data"),
    }
    event_payload = payload_map.get(event_type, data)

    await manager.broadcast(conversation_id, WSEvent(
        event=ws_event_type,
        data=event_payload,
        conversation_id=conversation_id,
    ))


global_bus.subscribe(on_bus_event)


# ── REST Chat Endpoint ────────────────────────────────────────────────

@router.post("/api/v1/chat", response_model=dict)
async def chat(request: ChatRequest):
    """
    Main chat endpoint.

    Runs the full multi-agent LangGraph pipeline synchronously so that
    the complete response is returned in the REST response body.
    This makes the endpoint compatible with serverless environments
    (Vercel) where background tasks are not supported.

    Connected WebSocket clients also receive real-time streaming events
    during processing when running on a persistent server.
    """
    conversation_id = request.conversation_id
    user_id = request.user_id
    mapped_user_id = to_uuid(user_id)

    # ── 1. Upsert conversation ─────────────────────────────────────
    if supabase_admin:
        try:
            supabase_admin.table("conversations").upsert({
                "id": conversation_id,
                "user_id": mapped_user_id,
                "title": request.message[:60],
                "updated_at": datetime.utcnow().isoformat(),
            }).execute()
        except Exception as e:
            print(f"[Supabase] conversation upsert error: {e}")

    # ── 2. Persist user message ────────────────────────────────────
    user_msg_id = str(uuid4())
    if supabase_admin:
        try:
            supabase_admin.table("messages").insert({
                "id": user_msg_id,
                "conversation_id": conversation_id,
                "role": "user",
                "content": request.message,
                "metadata": {},
                "created_at": datetime.utcnow().isoformat(),
            }).execute()
        except Exception as e:
            print(f"[Supabase] user message persist error: {e}")

    # ── 3. Create initial workflow record ──────────────────────────
    workflow_id = str(uuid4())
    if supabase_admin:
        try:
            supabase_admin.table("workflows").insert({
                "id": workflow_id,
                "user_id": mapped_user_id,
                "conversation_id": conversation_id,
                "title": f"Blueprint: {request.message[:50]}",
                "status": "running",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }).execute()
        except Exception as e:
            print(f"[Supabase] workflow create error: {e}")

    # ── 4. Broadcast start event to any WS listeners ───────────────
    await manager.broadcast(conversation_id, WSEvent(
        event=WSEventType.AGENT_THINKING,
        data={"agent_role": "orchestrator", "message": "Agents initializing..."},
        conversation_id=conversation_id,
    ))

    # ── 5. Load conversation history ───────────────────────────────
    history: list = []
    if supabase_admin:
        try:
            res = (
                supabase_admin.table("messages")
                .select("role, content")
                .eq("conversation_id", conversation_id)
                .order("created_at")
                .limit(20)
                .execute()
            )
            history = [
                {"role": m["role"], "content": m["content"]}
                for m in (res.data or [])
                if m.get("id") != user_msg_id
            ]
        except Exception as e:
            print(f"[Supabase] history load error: {e}")

    # ── 6. Run the multi-agent pipeline (synchronous) ──────────────
    final_msg_id = str(uuid4())
    final_content = ""
    task_count = 0

    try:
        state = await orchestrator.run(
            user_goal=request.message,
            conversation_id=conversation_id,
            user_id=user_id,
            history=history,
            autonomous=request.autonomous_mode,
            workflow_id=workflow_id,
        )

        task_count = len(state.get("tasks", []))
        final_content = _build_chat_response(state)

        # ── 7. Persist final workflow graph ────────────────────────
        if supabase_admin and workflow_id:
            try:
                supabase_admin.table("workflows").update({
                    "nodes": state.get("workflow_nodes", []),
                    "edges": state.get("workflow_edges", []),
                    "status": "completed",
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("id", workflow_id).execute()
            except Exception as e:
                print(f"[Supabase] workflow update error: {e}")

    except Exception as exc:
        print(f"[Pipeline] Error: {exc}")
        final_content = (
            f"The AutoPilot agents encountered an issue processing your request. "
            f"Error: {str(exc)[:200]}\n\n"
            "Please try again or rephrase your goal."
        )
        await manager.broadcast(conversation_id, WSEvent(
            event=WSEventType.ERROR,
            data={"error": str(exc)},
            conversation_id=conversation_id,
        ))

    # ── 8. Build and persist the final orchestrator message ─────────
    final_msg = {
        "id": final_msg_id,
        "conversation_id": conversation_id,
        "role": "assistant",
        "agent_role": "orchestrator",
        "content": final_content,
        "metadata": {"task_count": task_count},
        "created_at": datetime.utcnow().isoformat(),
    }

    if supabase_admin and final_content:
        try:
            # Check not already persisted by agent_message WS event
            existing = (
                supabase_admin.table("messages")
                .select("id")
                .eq("id", final_msg_id)
                .execute()
            )
            if not (existing.data):
                supabase_admin.table("messages").insert(final_msg).execute()
        except Exception as e:
            print(f"[Supabase] final message persist error: {e}")

    # ── 9. Broadcast stream_done to WS clients ─────────────────────
    await manager.broadcast(conversation_id, WSEvent(
        event=WSEventType.STREAM_DONE,
        data={"agent_role": "orchestrator", "task_count": task_count},
        conversation_id=conversation_id,
    ))

    return {
        "status": "success",
        "conversation_id": conversation_id,
        "workflow_id": workflow_id,
        "messages": state.get("agent_messages", []) if isinstance(state, dict) else [],
        "message": final_msg,
    }


# ── WebSocket Endpoint ────────────────────────────────────────────────

@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    """
    Real-time event stream per conversation.
    Receives ping/pong keep-alives and broadcasts orchestrator events.
    Note: On serverless (Vercel), this endpoint cannot hold persistent
    connections — the REST response delivers the full result instead.
    """
    await manager.connect(conversation_id, websocket)
    try:
        while True:
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
    """Assemble the human-readable markdown response from agent outputs."""
    task_count = len(state.get("tasks", []))
    pm_response = state.get("pm_response", "").strip()
    dev_response = state.get("dev_response", "").strip()
    marketing_response = state.get("marketing_response", "").strip()
    analyst_response = state.get("analyst_response", "").strip()

    # Use the richest agent response if available
    if pm_response and len(pm_response) > 200:
        return pm_response

    # Fallback: synthesize all agent outputs
    parts = ["## AutoPilot Orchestration Complete\n"]

    if pm_response:
        parts.append(f"### [Product Manager AI]\n{pm_response}\n")
    if dev_response:
        parts.append(f"---\n### [Developer AI]\n{dev_response}\n")
    if marketing_response:
        parts.append(f"---\n### [Marketing AI]\n{marketing_response}\n")
    if analyst_response:
        parts.append(f"---\n### [Analyst AI]\n{analyst_response}\n")

    if task_count:
        parts.append(f"\n---\n**✅ {task_count} tasks generated** across all agents.")

    parts.append("\n\n**Active Agents:** Product Manager · Developer · Marketing · Analyst · Operations")

    return "\n".join(parts)
