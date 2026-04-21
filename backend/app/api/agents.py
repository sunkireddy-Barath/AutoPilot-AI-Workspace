"""
Agent Activities API — read-only log of everything agents have done.
Powers the real-time activity timeline on the dashboard.
"""

from fastapi import APIRouter, Query
from typing import List, Optional

from app.db.supabase_client import supabase_admin

router = APIRouter(prefix="/agent-activities", tags=["agents"])


@router.get("/", response_model=List[dict])
async def get_agent_activities(
    conversation_id: Optional[str] = Query(None),
    agent_role: Optional[str] = Query(None),
    limit: int = Query(default=50, le=200),
):
    query = (
        supabase_admin.table("agent_activities")
        .select("*")
        .order("timestamp", desc=True)
        .limit(limit)
    )
    if conversation_id:
        query = query.eq("conversation_id", conversation_id)
    if agent_role:
        query = query.eq("agent_role", agent_role)

    result = query.execute()
    return result.data
