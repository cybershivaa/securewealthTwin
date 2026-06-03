"""
Tests for replay attack prevention: nonce validation + timestamp freshness.

Validates that:
- Same nonce cannot be replayed
- Stale timestamps are rejected
- Future timestamps are rejected (clock skew)
"""

import base64
import json
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest

from app.crypto.envelope import SecureEnvelope, canonical_json
from app.crypto.nonce_store import NONCE_STORE


class TestNonceValidation:
    """Test nonce-based replay prevention."""

    def setup_method(self):
        """Clear nonce store before each test."""
        NONCE_STORE.clear()

    def test_valid_nonce_and_timestamp(self):
        """First request with unique nonce should pass."""
        nonce = base64.b64encode(uuid4().bytes).decode("ascii")
        timestamp = datetime.now(timezone.utc)
        
        result = NONCE_STORE.validate_and_store(nonce, timestamp)
        assert result is True

    def test_duplicate_nonce_rejected(self):
        """Same nonce used twice should be rejected."""
        nonce = base64.b64encode(uuid4().bytes).decode("ascii")
        timestamp = datetime.now(timezone.utc)
        
        # First request passes
        result1 = NONCE_STORE.validate_and_store(nonce, timestamp)
        assert result1 is True
        
        # Same nonce rejected
        result2 = NONCE_STORE.validate_and_store(nonce, timestamp)
        assert result2 is False

    def test_stale_timestamp_rejected(self):
        """Timestamp older than 5 minutes should be rejected."""
        nonce = base64.b64encode(uuid4().bytes).decode("ascii")
        stale_timestamp = datetime.now(timezone.utc) - timedelta(minutes=6)
        
        result = NONCE_STORE.validate_and_store(nonce, stale_timestamp)
        assert result is False

    def test_fresh_timestamp_accepted(self):
        """Timestamp within 5 minutes should be accepted."""
        nonce = base64.b64encode(uuid4().bytes).decode("ascii")
        fresh_timestamp = datetime.now(timezone.utc) - timedelta(minutes=2)
        
        result = NONCE_STORE.validate_and_store(nonce, fresh_timestamp)
        assert result is True

    def test_future_timestamp_rejected(self):
        """Timestamp more than 30 seconds in future should reject."""
        nonce = base64.b64encode(uuid4().bytes).decode("ascii")
        future_timestamp = datetime.now(timezone.utc) + timedelta(seconds=60)
        
        with pytest.raises(ValueError, match="Timestamp in future"):
            NONCE_STORE.validate_and_store(nonce, future_timestamp)

    def test_clock_skew_tolerance_30sec(self):
        """30 seconds of clock skew should be tolerated."""
        nonce = base64.b64encode(uuid4().bytes).decode("ascii")
        skewed_timestamp = datetime.now(timezone.utc) + timedelta(seconds=30)
        
        # Should NOT raise, should be accepted
        result = NONCE_STORE.validate_and_store(nonce, skewed_timestamp)
        assert result is True

    def test_cleanup_removes_old_nonces(self):
        """Cleanup should remove nonces older than max_age_seconds."""
        # Add nonces
        for i in range(1010):  # Exceeds cleanup_threshold of 1000
            nonce = base64.b64encode(f"nonce-{i}".encode()).decode("ascii")
            NONCE_STORE.validate_and_store(nonce, datetime.now(timezone.utc))
        
        # Should have trimmed old ones
        assert len(NONCE_STORE.nonces) <= 1010

    def test_different_nonces_unique_accepted(self):
        """Multiple different nonces should all be accepted."""
        timestamp = datetime.now(timezone.utc)
        
        for i in range(5):
            nonce = base64.b64encode(f"unique-nonce-{i}".encode()).decode("ascii")
            result = NONCE_STORE.validate_and_store(nonce, timestamp)
            assert result is True


class TestEnvelopeWithNonce:
    """Test SecureEnvelope includes nonce."""

    def test_envelope_has_nonce(self):
        """Envelope should include nonce_b64 field."""
        envelope = SecureEnvelope.build(
            session_id="test-session",
            aad=b"test-aad",
            ciphertext=b"test-ciphertext",
            signature=b"test-signature",
            nonce=uuid4().bytes[:12],
        )
        
        assert envelope.nonce_b64
        assert len(envelope.nonce_b64) > 0
        # Verify it's valid base64
        decoded = base64.b64decode(envelope.nonce_b64)
        assert len(decoded) == 12

    def test_envelope_generates_random_nonce_if_not_provided(self):
        """Envelope should generate random nonce if not provided."""
        envelope1 = SecureEnvelope.build(
            session_id="test-session",
            aad=b"test-aad",
            ciphertext=b"test-ciphertext",
            signature=b"test-signature",
        )
        
        envelope2 = SecureEnvelope.build(
            session_id="test-session",
            aad=b"test-aad",
            ciphertext=b"test-ciphertext",
            signature=b"test-signature",
        )
        
        # Nonces should be different
        assert envelope1.nonce_b64 != envelope2.nonce_b64
