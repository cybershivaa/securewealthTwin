from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, LargeBinary, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class SecurePayloadRecord(Base):
    __tablename__ = "secure_payload_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    request_id: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    key_id: Mapped[str] = mapped_column(String(128), nullable=False)
    aad_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    iv: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    ciphertext: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)


class ReplayCacheRecord(Base):
    __tablename__ = "replay_cache_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    request_id: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    nonce: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    session_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
