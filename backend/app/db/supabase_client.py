"""
Supabase database client — wraps both anon and service-role clients.
Falls back to an in-memory mock when Supabase is unreachable.
"""

import socket
from typing import Any
from supabase import create_client
from app.config import settings


# ── In-memory store for mock mode ────────────────────────────────────────────

_store: dict[str, list[dict]] = {
    "conversations": [],
    "messages": [],
    "tasks": [],
    "workflows": [],
    "agent_activities": [],
    "files": [],
}


class MockResult:
    def __init__(self, data):
        self.data = data or []


class MockBuilder:
    """Fluent query builder backed by _store for offline/demo mode."""

    def __init__(self, table: str, data: list | None = None):
        self._table = table
        self._data: list[dict] = list(data if data is not None else _store.get(table, []))
        self._insert_payload: list[dict] | None = None
        self._update_payload: dict | None = None
        self._upsert_payload: list[dict] | None = None
        self._delete_mode = False
        self._order_key: str | None = None
        self._order_desc = False
        self._limit_val: int | None = None
        self._filters: list[tuple] = []

    # ── Chain methods ──────────────────────────────────────────────────────

    def select(self, *args, **kwargs):
        return self

    def eq(self, col: str, val):
        self._filters.append(("eq", col, val))
        return self

    def neq(self, col: str, val):
        self._filters.append(("neq", col, val))
        return self

    def lte(self, col: str, val):
        self._filters.append(("lte", col, val))
        return self

    def gte(self, col: str, val):
        self._filters.append(("gte", col, val))
        return self

    def order(self, col: str, desc: bool = False, **kwargs):
        self._order_key = col
        self._order_desc = desc or kwargs.get("ascending") is False
        return self

    def limit(self, n: int):
        self._limit_val = n
        return self

    def insert(self, payload):
        if isinstance(payload, list):
            self._insert_payload = payload
        else:
            self._insert_payload = [payload]
        return self

    def upsert(self, payload, **kwargs):
        if isinstance(payload, list):
            self._upsert_payload = payload
        else:
            self._upsert_payload = [payload]
        return self

    def update(self, payload: dict):
        self._update_payload = payload
        return self

    def delete(self, *args, **kwargs):
        self._delete_mode = True
        return self

    # ── Execute ────────────────────────────────────────────────────────────

    def execute(self) -> MockResult:
        table = _store.setdefault(self._table, [])

        if self._insert_payload is not None:
            table.extend(self._insert_payload)
            return MockResult(list(self._insert_payload))

        if self._upsert_payload is not None:
            for row in self._upsert_payload:
                pk = row.get("id")
                replaced = False
                if pk:
                    for i, existing in enumerate(table):
                        if existing.get("id") == pk:
                            table[i] = {**existing, **row}
                            replaced = True
                            break
                if not replaced:
                    table.append(row)
            return MockResult(list(self._upsert_payload))

        if self._delete_mode:
            filtered = self._apply_filters(table)
            ids_to_delete = {r.get("id") for r in filtered}
            _store[self._table] = [r for r in table if r.get("id") not in ids_to_delete]
            return MockResult([])

        if self._update_payload is not None:
            rows = self._apply_filters(table)
            result_rows = []
            for row in rows:
                row.update(self._update_payload)
                result_rows.append(row)
            return MockResult(result_rows)

        # SELECT
        rows = self._apply_filters(table)
        if self._order_key:
            rows = sorted(rows, key=lambda r: r.get(self._order_key) or "", reverse=self._order_desc)
        if self._limit_val is not None:
            rows = rows[: self._limit_val]
        return MockResult(list(rows))

    def _apply_filters(self, rows: list[dict]) -> list[dict]:
        result = list(rows)
        for op, col, val in self._filters:
            if op == "eq":
                result = [r for r in result if str(r.get(col, "")) == str(val)]
            elif op == "neq":
                result = [r for r in result if str(r.get(col, "")) != str(val)]
            elif op == "lte":
                result = [r for r in result if r.get(col, 0) <= val]
            elif op == "gte":
                result = [r for r in result if r.get(col, 0) >= val]
        return result


class MockSupabaseClient:
    """In-memory Supabase replacement for offline/demo mode."""

    def table(self, table_name: str) -> MockBuilder:
        return MockBuilder(table_name)


# ── Connectivity probe ────────────────────────────────────────────────────────

def _supabase_reachable() -> bool:
    """Return True only if the Supabase hostname resolves."""
    try:
        host = settings.supabase_url.replace("https://", "").replace("http://", "").split("/")[0]
        socket.getaddrinfo(host, 443, proto=socket.IPPROTO_TCP)
        return True
    except socket.gaierror:
        return False


# ── Client factories ──────────────────────────────────────────────────────────

def get_supabase_client() -> Any:
    try:
        if not settings.supabase_url or "dummy" in settings.supabase_url:
            print("⚠️  Supabase URL not configured — using mock client")
            return MockSupabaseClient()
        if not _supabase_reachable():
            print("⚠️  Supabase unreachable — using mock client (demo mode)")
            return MockSupabaseClient()
        return create_client(settings.supabase_url, settings.supabase_anon_key)
    except Exception as e:
        print(f"⚠️  Supabase init warning: {e} — using mock client")
        return MockSupabaseClient()


def get_supabase_admin_client() -> Any:
    try:
        if not settings.supabase_url or "dummy" in settings.supabase_url:
            print("⚠️  Supabase URL not configured — using mock admin client")
            return MockSupabaseClient()
        if not _supabase_reachable():
            print("⚠️  Supabase unreachable — using mock admin client (demo mode)")
            return MockSupabaseClient()
        return create_client(settings.supabase_url, settings.supabase_service_role_key)
    except Exception as e:
        print(f"⚠️  Supabase admin init warning: {e} — using mock client")
        return MockSupabaseClient()


# Module-level singletons
supabase: Any = get_supabase_client()
supabase_admin: Any = get_supabase_admin_client()
