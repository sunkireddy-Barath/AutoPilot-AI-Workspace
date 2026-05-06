"""
Conversations API — manage multi-turn AI conversations.
Each conversation holds messages and links to tasks/workflows the AI created.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List
from datetime import datetime
from uuid import uuid4

from app.models.schemas import ConversationCreate
from app.db.supabase_client import supabase_admin
from app.utils.auth_utils import to_uuid

router = APIRouter(tags=["conversations"])


@router.get("/", response_model=List[dict])
async def get_conversations(user_id: str = Query(...)):
    mapped_user_id = to_uuid(user_id)
    result = (
        supabase_admin.table("conversations")
        .select("*")
        .eq("user_id", mapped_user_id)
        .order("updated_at", desc=True)
        .execute()
    )
    return result.data


@router.post("/", response_model=dict, status_code=201)
async def create_conversation(payload: ConversationCreate):
    now = datetime.utcnow().isoformat()
    mapped_user_id = to_uuid(payload.user_id)
    data = {
        "id": str(uuid4()),
        "user_id": mapped_user_id,
        "title": payload.title,
        "created_at": now,
        "updated_at": now,
    }
    result = supabase_admin.table("conversations").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create conversation")
    return result.data[0]


@router.get("/{conversation_id}", response_model=dict)
async def get_conversation(conversation_id: str):
    result = (
        supabase_admin.table("conversations")
        .select("*, messages(*)")
        .eq("id", conversation_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return result.data[0]


@router.get("/{conversation_id}/messages", response_model=List[dict])
async def get_messages(conversation_id: str):
    result = (
        supabase_admin.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    )
    return result.data


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: str):
    # Cascade delete handles messages
    supabase_admin.table("conversations").delete().eq("id", conversation_id).execute()
