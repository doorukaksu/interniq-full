"""
Tests for api/services/rate_limiter.py

Verifies correct sliding-window behaviour, retry-after calculation,
and thread safety under concurrent access.
"""
import time
import threading

import pytest

from api.services.rate_limiter import RateLimiter


# ── Allow / block logic ───────────────────────────────────────────────────────

def test_first_request_is_allowed():
    rl = RateLimiter(max_requests=5, window=3600)
    allowed, retry = rl.is_allowed("1.2.3.4")
    assert allowed is True
    assert retry == 0


def test_requests_within_limit_are_all_allowed():
    rl = RateLimiter(max_requests=5, window=3600)
    for _ in range(5):
        allowed, _ = rl.is_allowed("1.2.3.4")
        assert allowed is True


def test_request_at_limit_is_blocked():
    rl = RateLimiter(max_requests=3, window=3600)
    for _ in range(3):
        rl.is_allowed("1.2.3.4")
    allowed, retry = rl.is_allowed("1.2.3.4")
    assert allowed is False
    assert retry > 0


def test_different_ips_are_independent():
    rl = RateLimiter(max_requests=1, window=3600)
    allowed_a, _ = rl.is_allowed("10.0.0.1")
    allowed_b, _ = rl.is_allowed("10.0.0.2")
    assert allowed_a is True
    assert allowed_b is True


def test_second_request_from_same_ip_blocked_at_limit_1():
    rl = RateLimiter(max_requests=1, window=3600)
    rl.is_allowed("192.168.1.1")
    allowed, retry = rl.is_allowed("192.168.1.1")
    assert allowed is False
    assert retry > 0


# ── Retry-after calculation ───────────────────────────────────────────────────

def test_retry_after_is_positive_when_blocked():
    rl = RateLimiter(max_requests=1, window=60)
    rl.is_allowed("5.5.5.5")
    allowed, retry = rl.is_allowed("5.5.5.5")
    assert not allowed
    # retry_after should be close to the window (≤ window + 1)
    assert 0 < retry <= 61


def test_retry_after_decreases_near_window_edge():
    """Requests made early in the window should have a longer retry-after."""
    rl = RateLimiter(max_requests=1, window=100)
    rl.is_allowed("6.6.6.6")
    _, retry = rl.is_allowed("6.6.6.6")
    # Should be close to 100 seconds, not 0
    assert retry > 90


# ── Remaining counter ─────────────────────────────────────────────────────────

def test_remaining_decrements_with_each_request():
    rl = RateLimiter(max_requests=5, window=3600)
    assert rl.remaining("7.7.7.7") == 5
    rl.is_allowed("7.7.7.7")
    assert rl.remaining("7.7.7.7") == 4
    rl.is_allowed("7.7.7.7")
    assert rl.remaining("7.7.7.7") == 3


def test_remaining_is_zero_when_limit_hit():
    rl = RateLimiter(max_requests=2, window=3600)
    rl.is_allowed("8.8.8.8")
    rl.is_allowed("8.8.8.8")
    assert rl.remaining("8.8.8.8") == 0


def test_remaining_never_goes_negative():
    rl = RateLimiter(max_requests=2, window=3600)
    for _ in range(10):
        rl.is_allowed("9.9.9.9")
    assert rl.remaining("9.9.9.9") == 0


# ── Window expiry ─────────────────────────────────────────────────────────────

def test_old_requests_expire_after_window():
    """Requests older than the window should not count against the limit."""
    rl = RateLimiter(max_requests=2, window=1)  # 1-second window
    rl.is_allowed("10.0.0.1")
    rl.is_allowed("10.0.0.1")
    # Both slots used — blocked now
    allowed, _ = rl.is_allowed("10.0.0.1")
    assert not allowed

    # Wait for window to expire
    time.sleep(1.1)

    # Slot should be available again
    allowed, _ = rl.is_allowed("10.0.0.1")
    assert allowed is True


# ── Thread safety ─────────────────────────────────────────────────────────────

def test_concurrent_requests_respect_limit():
    """Under concurrent load, total allowed requests must not exceed max_requests."""
    rl = RateLimiter(max_requests=10, window=3600)
    results = []
    lock = threading.Lock()

    def make_request():
        allowed, _ = rl.is_allowed("concurrent.ip")
        with lock:
            results.append(allowed)

    threads = [threading.Thread(target=make_request) for _ in range(30)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    allowed_count = sum(1 for r in results if r)
    assert allowed_count == 10, f"Expected exactly 10 allowed, got {allowed_count}"
