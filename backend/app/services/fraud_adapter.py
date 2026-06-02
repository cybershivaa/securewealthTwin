from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class FraudChannelPayload:
    channel: str
    user_id: str
    device_id: str
    session_id: str
    risk_score: int
    body: dict


class FraudDetectionAdapter:
    def normalize(self, payload: dict, channel: str) -> FraudChannelPayload:
        return FraudChannelPayload(
            channel=channel,
            user_id=str(payload.get("user_id", "")),
            device_id=str(payload.get("device_id", "")),
            session_id=str(payload.get("session_id", "")),
            risk_score=int(payload.get("risk_score", 0)),
            body=payload,
        )

    def route_name(self, channel: str) -> str:
        return {
            "sms": "sms-fraud-detection",
            "email": "email-fraud-detection",
            "voice": "voice-fraud-detection",
            "semantic": "semantic-fraud-detection",
            "feedback": "feedback-learning",
        }.get(channel, "fraud-detection")


FRAUD_ADAPTER = FraudDetectionAdapter()
