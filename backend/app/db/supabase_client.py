"""
Supabase database client — wraps both anon and service-role clients.
Anon client is used for user-context operations.
Service role client is used for backend admin operations (bypasses RLS).
"""

from typing import List, Optional
from supabase import create_client, Client
from app.config import settings


def get_supabase_client() -> Optional[Client]:
    """Return the Supabase anon client (user-context)."""
    try:
        if not settings.supabase_url or "dummy" in settings.supabase_url:
            return None
        return create_client(settings.supabase_url, settings.supabase_anon_key)
    except Exception as e:
        print(f"⚠️ Supabase Init Warning: {e}")
        return None


def get_supabase_admin_client() -> Optional[Client]:
    """Return the Supabase service-role client (admin / backend use only)."""
    try:
        if not settings.supabase_url or "dummy" in settings.supabase_url:
            return None
        return create_client(
            settings.supabase_url, settings.supabase_service_role_key
        )
    except Exception as e:
        print(f"⚠️ Supabase Admin Init Warning: {e}")
        return None


# Module-level singletons
supabase: Optional[Client] = get_supabase_client()
supabase_admin: Optional[Client] = get_supabase_admin_client()
