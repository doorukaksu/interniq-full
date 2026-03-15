import os
import json
import re
from pathlib import Path
from datetime import datetime, timezone

# ─── Simple file-based store (swap this for Postgres/Supabase in production) ──
#
# To use Supabase:
#   1. pip install supabase
#   2. Replace _save_email() with a Supabase insert
#   3. Set SUPABASE_URL and SUPABASE_KEY in your .env
#
WAITLIST_FILE = Path(os.environ.get("WAITLIST_FILE", "/tmp/waitlist.json"))

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")


def _load() -> list[dict]:
    if not WAITLIST_FILE.exists():
        return []
    try:
        return json.loads(WAITLIST_FILE.read_text())
    except (json.JSONDecodeError, OSError):
        return []


def _save(entries: list[dict]) -> None:
    WAITLIST_FILE.write_text(json.dumps(entries, indent=2))


def add_to_waitlist(email: str) -> dict:
    """
    Validate and store an email address.
    Returns {"already_existed": bool}.
    Raises ValueError for invalid emails.
    """
    email = email.strip().lower()

    if not EMAIL_REGEX.match(email):
        raise ValueError("Invalid email address.")

    entries = _load()

    # Check for duplicates
    existing = [e for e in entries if e.get("email") == email]
    if existing:
        return {"already_existed": True}

    entries.append(
        {
            "email": email,
            "signed_up_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    _save(entries)
    return {"already_existed": False}


def get_waitlist_count() -> int:
    return len(_load())
