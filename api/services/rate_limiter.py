from collections import defaultdict
from datetime import datetime, timezone
from threading import Lock

# ─── Config ───────────────────────────────────────────────────────────────────
MAX_REQUESTS = 5          # per window
WINDOW_SECONDS = 3600     # 1 hour


class RateLimiter:
    """
    Simple in-memory sliding-window rate limiter keyed by IP address.

    For multi-instance deployments (e.g. multiple Vercel serverless instances),
    swap this for a Redis-backed implementation — see _RedisRateLimiter stub below.
    """

    def __init__(self, max_requests: int = MAX_REQUESTS, window: int = WINDOW_SECONDS):
        self.max_requests = max_requests
        self.window = window
        self._store: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def is_allowed(self, key: str) -> tuple[bool, int]:
        """
        Check if the key (IP) is within the rate limit.
        Returns (allowed: bool, retry_after_seconds: int).
        """
        now = datetime.now(timezone.utc).timestamp()
        cutoff = now - self.window

        with self._lock:
            # Prune old timestamps
            self._store[key] = [t for t in self._store[key] if t > cutoff]

            if len(self._store[key]) >= self.max_requests:
                oldest = self._store[key][0]
                retry_after = int(self.window - (now - oldest)) + 1
                return False, retry_after

            self._store[key].append(now)
            return True, 0

    def remaining(self, key: str) -> int:
        """How many requests the key has left in the current window."""
        now = datetime.now(timezone.utc).timestamp()
        cutoff = now - self.window
        with self._lock:
            active = [t for t in self._store[key] if t > cutoff]
            return max(0, self.max_requests - len(active))


# ─── Singleton ────────────────────────────────────────────────────────────────
# One instance shared across requests in the same process.
# On Vercel each cold-start gets a fresh instance — acceptable for MVP.
rate_limiter = RateLimiter()
