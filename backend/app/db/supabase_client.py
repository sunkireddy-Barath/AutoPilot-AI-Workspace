"""
Supabase database client — wraps both anon and service-role clients.
Anon client is used for user-context operations.
Service role client is used for backend admin operations (bypasses RLS).
"""

from typing import List, Optional, Any
from supabase import create_client, Client
from app.config import settings

class MockBuilder:
    def __init__(self, data=None):
        self.data = data or []

    def select(self, *args, **kwargs): return self
    def eq(self, *args, **kwargs): return self
    def order(self, *args, **kwargs): return self
    def insert(self, data): 
        if isinstance(data, list):
            self.data = data
        else:
            self.data = [data]
        return self
    def delete(self, *args, **kwargs): return self
    def execute(self): return self


class MockSupabaseClient:
    """A minimal mock client for demo mode when Supabase is not configured."""
    def table(self, table_name: str) -> MockBuilder:
        # Return some mock data based on table if needed, for now just empty builder
        if table_name == "conversations":
            # Just an empty array to simulate no past conversations
            return MockBuilder([])
        return MockBuilder()


def get_supabase_client() -> Any:
    """Return the Supabase anon client (user-context)."""
    try:
        if not settings.supabase_url or "dummy" in settings.supabase_url:
            print("⚠️ Using Mock Supabase Client (Anon)")
            return MockSupabaseClient()
        return create_client(settings.supabase_url, settings.supabase_anon_key)
    except Exception as e:
        print(f"⚠️ Supabase Init Warning: {e}")
        return MockSupabaseClient()


def get_supabase_admin_client() -> Any:
    """Return the Supabase service-role client (admin / backend use only)."""
    try:
        if not settings.supabase_url or "dummy" in settings.supabase_url:
            print("⚠️ Using Mock Supabase Admin Client")
            return MockSupabaseClient()
        return create_client(
            settings.supabase_url, settings.supabase_service_role_key
        )
    except Exception as e:
        print(f"⚠️ Supabase Admin Init Warning: {e}")
        return MockSupabaseClient()


# Module-level singletons
supabase: Any = get_supabase_client()
supabase_admin: Any = get_supabase_admin_client()
