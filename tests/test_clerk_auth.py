"""
Tests for api/services/clerk_auth.py

Verifies that Clerk JWT verification correctly accepts valid tokens,
rejects tampered / expired / wrong-issuer tokens, and handles
network failures gracefully.

We generate real RS256 key pairs so the test tokens are actually
signed and verifiable — not just mock data.
"""
import time
from unittest.mock import MagicMock, patch

import pytest
import httpx
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from jose import jwt

from api.services.clerk_auth import verify_clerk_token, require_auth


# ── RSA key generation helpers ────────────────────────────────────────────────

def _generate_rsa_key():
    return rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend(),
    )


def _private_key_to_jwks(private_key, kid: str = "test-key-1") -> dict:
    """Export the public half of an RSA key as a JWKS dict."""
    from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
    from jose.backends import RSAKey
    import json

    pub = private_key.public_key()
    pub_pem = pub.public_bytes(Encoding.PEM, PublicFormat.SubjectPublicKeyInfo)
    rsa_key = RSAKey(pub_pem.decode(), "RS256")
    key_dict = rsa_key.public_key().to_dict()
    key_dict["kid"] = kid
    key_dict["use"] = "sig"
    return {"keys": [key_dict]}


def _make_token(
    private_key,
    kid: str = "test-key-1",
    issuer: str = "https://clerk.test.example.com",
    subject: str = "user_testxxx",
    exp_offset: int = 3600,
    extra_claims: dict | None = None,
) -> str:
    now = int(time.time())
    payload = {
        "sub": subject,
        "iss": issuer,
        "iat": now,
        "exp": now + exp_offset,
        "email": "test@example.com",
        **(extra_claims or {}),
    }
    headers = {"alg": "RS256", "kid": kid}
    from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption
    pem = private_key.private_bytes(Encoding.PEM, PrivateFormat.TraditionalOpenSSL, NoEncryption())
    return jwt.encode(payload, pem.decode(), algorithm="RS256", headers=headers)


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def rsa_key():
    return _generate_rsa_key()


@pytest.fixture
def jwks(rsa_key):
    return _private_key_to_jwks(rsa_key)


@pytest.fixture
def valid_token(rsa_key):
    return _make_token(rsa_key)


@pytest.fixture
def mock_jwks_fetch(jwks):
    """Patch _get_jwks() to return our test JWKS without hitting the network."""
    with patch("api.services.clerk_auth._get_jwks", return_value=jwks):
        yield


# ── verify_clerk_token tests ──────────────────────────────────────────────────

def test_valid_token_returns_payload(valid_token, mock_jwks_fetch):
    payload = verify_clerk_token(valid_token)
    assert payload["sub"] == "user_testxxx"
    assert payload["email"] == "test@example.com"


def test_expired_token_raises_401(rsa_key, mock_jwks_fetch):
    expired_token = _make_token(rsa_key, exp_offset=-10)  # expired 10s ago
    with pytest.raises(HTTPException) as exc:
        verify_clerk_token(expired_token)
    assert exc.value.status_code == 401


def test_wrong_issuer_raises_401(rsa_key, jwks, mock_jwks_fetch):
    wrong_issuer_token = _make_token(rsa_key, issuer="https://evil.attacker.com")
    with pytest.raises(HTTPException) as exc:
        verify_clerk_token(wrong_issuer_token)
    assert exc.value.status_code == 401


def test_token_signed_with_different_key_raises_401(rsa_key, mock_jwks_fetch):
    """Token signed by a different private key than the one in JWKS must be rejected."""
    attacker_key = _generate_rsa_key()
    forged_token = _make_token(attacker_key)  # signed with different key
    with pytest.raises(HTTPException) as exc:
        verify_clerk_token(forged_token)
    assert exc.value.status_code == 401


def test_malformed_token_raises_401(mock_jwks_fetch):
    with pytest.raises(HTTPException) as exc:
        verify_clerk_token("not.a.jwt")
    assert exc.value.status_code == 401


def test_empty_token_raises_401(mock_jwks_fetch):
    with pytest.raises(HTTPException) as exc:
        verify_clerk_token("")
    assert exc.value.status_code == 401


def test_jwks_fetch_failure_raises_503(valid_token):
    """If Clerk's JWKS endpoint is unreachable, return 503 not 500."""
    with patch(
        "api.services.clerk_auth._get_jwks",
        side_effect=httpx.NetworkError("connection refused"),
    ):
        with pytest.raises(HTTPException) as exc:
            verify_clerk_token(valid_token)
    assert exc.value.status_code == 503


# ── require_auth dependency tests ─────────────────────────────────────────────

def test_require_auth_raises_401_when_no_credentials():
    """require_auth must reject None credentials with 401."""
    with pytest.raises(HTTPException) as exc:
        require_auth(credentials=None)
    assert exc.value.status_code == 401
    assert "WWW-Authenticate" in exc.value.headers


def test_require_auth_passes_token_to_verify(valid_token, mock_jwks_fetch):
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=valid_token)
    payload = require_auth(credentials=creds)
    assert payload["sub"] == "user_testxxx"


def test_require_auth_propagates_401_from_verify(mock_jwks_fetch):
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="bad.token.here")
    with pytest.raises(HTTPException) as exc:
        require_auth(credentials=creds)
    assert exc.value.status_code == 401
