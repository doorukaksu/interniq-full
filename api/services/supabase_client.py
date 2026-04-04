"""
Supabase client singleton for InternIQ backend.

Uses the service role key which bypasses RLS — only used server-side, never
exposed to the frontend. All queries run as the service role.
"""

import os
from supabase import create_client, Client

_client: Client | None = None


def get_supabase() -> Client:
    """Return the shared Supabase client, creating it on first call."""
    global _client
    if _client is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
            )
        _client = create_client(url, key)
    return _client
