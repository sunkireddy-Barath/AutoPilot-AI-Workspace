from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.db.supabase_client import supabase_admin

router = APIRouter(tags=["search"])

@router.get("/global")
async def global_search(query: str, user_id: str):
    """
    Performs a cross-table search for projects, tasks, and agents.
    """
    if not supabase_admin:
        return {"results": []}

    results = []

    try:
        # 1. Search Conversations (Projects)
        conv_res = supabase_admin.table("conversations")\
            .select("id, title, updated_at")\
            .eq("user_id", user_id)\
            .ilike("title", f"%{query}%")\
            .limit(5)\
            .execute()
        
        for c in conv_res.data:
            results.append({
                "type": "project",
                "id": c["id"],
                "title": c["title"],
                "subtitle": f"Updated {c['updated_at'][:10]}",
                "route": "/chat"
            })

        # 2. Search Tasks
        task_res = supabase_admin.table("tasks")\
            .select("id, title, status, conversation_id")\
            .eq("user_id", user_id)\
            .ilike("title", f"%{query}%")\
            .limit(5)\
            .execute()
        
        for t in task_res.data:
            results.append({
                "type": "task",
                "id": t["id"],
                "title": t["title"],
                "subtitle": f"Status: {t['status']}",
                "route": "/chat",
                "conv_id": t["conversation_id"]
            })

        return {"results": results}

    except Exception as e:
        print(f"Search Error: {e}")
        return {"results": []}
