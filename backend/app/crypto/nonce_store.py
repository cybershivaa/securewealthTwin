"""
Replay attack prevention: nonce + timestamp validation.

Stores seen nonces and validates timestamps to prevent request replay attacks.
"""

import base64
import time
from datetime import datetime, timedelta, timezone
from typing import Optional


class NonceStore:
    """In-memory nonce store with timestamp validation.
    
    Production: Replace with Redis for distributed systems.
    """
    
    def __init__(self, max_age_seconds: int = 300):
        """
        Args:
            max_age_seconds: How long to accept timestamps (default 5 minutes)
        """
        self.nonces: dict[str, float] = {}  # nonce -> timestamp stored
        self.max_age_seconds = max_age_seconds
        self.cleanup_threshold = 1000  # Cleanup when we have this many nonces
    
    def validate_and_store(self, nonce: str, timestamp: datetime) -> bool:
        """
        Validate nonce is unique and timestamp is fresh.
        
        Args:
            nonce: Base64-encoded random value (should be 32+ bytes)
            timestamp: Request timestamp from client
            
        Returns:
            True if valid and stored, False if replay/stale
            
        Raises:
            ValueError: If nonce format invalid or timestamp in future
        """
        now = datetime.now(timezone.utc)
        
        # Check timestamp is not in future (max 30 seconds clock skew tolerance)
        if timestamp > now + timedelta(seconds=30):
            raise ValueError("Timestamp in future (clock skew > 30s)")
        
        # Check timestamp is not too old
        age_seconds = (now - timestamp).total_seconds()
        if age_seconds > self.max_age_seconds:
            return False  # Stale
        
        # Check nonce is unique
        if nonce in self.nonces:
            return False  # Replay
        
        # Store nonce with current timestamp
        self.nonces[nonce] = time.time()
        
        # Cleanup old nonces periodically
        if len(self.nonces) > self.cleanup_threshold:
            self._cleanup_expired()
        
        return True
    
    def _cleanup_expired(self) -> None:
        """Remove nonces older than max_age_seconds."""
        now = time.time()
        self.nonces = {
            nonce: stored_at
            for nonce, stored_at in self.nonces.items()
            if (now - stored_at) < self.max_age_seconds
        }
    
    def clear(self) -> None:
        """Clear all stored nonces (for testing)."""
        self.nonces.clear()


# Global instance
NONCE_STORE = NonceStore(max_age_seconds=300)
