"""
Tasks API — CRUD operations for AI-generated tasks.
Tasks are created by agents and tracked through their lifecycle.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

from app.models.schemas import Task, TaskCreate, TaskUpdate, TaskStatus
from app.db.supabase_client import supabase_admin
from app.utils.auth_utils import to_uuid

router = APIRouter(tags=["tasks"])


@router.get("/", response_model=List[dict])
async def get_tasks(
    user_id: str = Query(..., description="User ID to filter tasks"),
    status: Optional[str] = Query(None, description="Filter by status"),
    conversation_id: Optional[str] = Query(None),
):
    mapped_user_id = to_uuid(user_id)
    query = supabase_admin.table("tasks").select("*").eq("user_id", mapped_user_id)

    if status:
        query = query.eq("status", status)
    if conversation_id:
        query = query.eq("conversation_id", conversation_id)

    result = query.order("created_at", desc=True).execute()
    return result.data


@router.post("/", response_model=dict, status_code=201)
async def create_task(payload: TaskCreate):
    now = datetime.utcnow().isoformat()
    mapped_user_id = to_uuid(payload.user_id)
    data = {
        "id": str(uuid4()),
        "user_id": mapped_user_id,
        "conversation_id": payload.conversation_id,
        "workflow_id": payload.workflow_id,
        "title": payload.title,
        "description": payload.description,
        "status": payload.status.value,
        "priority": payload.priority.value,
        "assigned_agent": payload.assigned_agent.value if payload.assigned_agent else None,
        "progress": 0,
        "created_at": now,
        "updated_at": now,
    }
    result = supabase_admin.table("tasks").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create task")
    return result.data[0]


@router.get("/{task_id}", response_model=dict)
async def get_task(task_id: str):
    result = supabase_admin.table("tasks").select("*").eq("id", task_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return result.data[0]


@router.patch("/{task_id}", response_model=dict)
async def update_task(task_id: str, payload: TaskUpdate):
    update_data: dict = {"updated_at": datetime.utcnow().isoformat()}

    if payload.title is not None:
        update_data["title"] = payload.title
    if payload.description is not None:
        update_data["description"] = payload.description
    if payload.status is not None:
        update_data["status"] = payload.status.value
    if payload.priority is not None:
        update_data["priority"] = payload.priority.value
    if payload.progress is not None:
        update_data["progress"] = payload.progress
    if payload.assigned_agent is not None:
        update_data["assigned_agent"] = payload.assigned_agent.value

    result = (
        supabase_admin.table("tasks")
        .update(update_data)
        .eq("id", task_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return result.data[0]


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: str):
    supabase_admin.table("tasks").delete().eq("id", task_id).execute()
