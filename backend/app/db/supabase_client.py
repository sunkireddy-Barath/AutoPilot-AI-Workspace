"""
Supabase database client — wraps both anon and service-role clients.
Anon client is used for user-context operations.
Service role client is used for backend admin operations (bypasses RLS).
"""

from supabase import create_client, Client
from app.config import settings


def get_supabase_client() -> Client:
    """Return the Supabase anon client (user-context)."""
    return create_client(settings.supabase_url, settings.supabase_anon_key)


def get_supabase_admin_client() -> Client:
    """Return the Supabase service-role client (admin / backend use only)."""
    return create_client(
        settings.supabase_url, settings.supabase_service_role_key
    )


# Module-level singletons — created once at import time
supabase: Client = get_supabase_client()
supabase_admin: Client = get_supabase_admin_client()
