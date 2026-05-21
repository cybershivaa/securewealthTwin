"""
Fraud Scoring Engine
====================
Combines AI model output with rule-based boosters for final
fraud assessment. Generates actionable recommendations.
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class FraudScoringEngine:
    """
    Takes raw AI analysis results and produces the final fraud verdict
    with scoring adjustments, actionable suggestions, and risk levels.
    """

    # Minimum thresholds for each classification
    FRAUD_THRESHOLD = 55.0
    SUSPICIOUS_THRESHOLD = 30.0

    # Risk level descriptions
    RISK_LEVELS = {
        "CRITICAL": {"min": 85, "color": "#dc2626", "action": "Block immediately. Do not interact."},
        "HIGH": {"min": 65, "color": "#ea580c", "action": "High fraud risk. Do not share any information."},
        "MEDIUM": {"min": 40, "color": "#ca8a04", "action": "Exercise caution. Verify through official channels."},
        "LOW": {"min": 15, "color": "#2563eb", "action": "Low risk but stay vigilant."},
        "SAFE": {"min": 0, "color": "#16a34a", "action": "Appears safe. Standard precautions apply."},
    }

    def score(self, ai_result: Dict, preprocessed: Dict) -> Dict:
        """
        Final scoring pipeline.
        
        Args:
            ai_result: Output from SemanticFraudAnalyzer.analyze()
            preprocessed: Output from TextPreprocessor.prepare_for_model()
        
        Returns:
            Complete fraud assessment with classification, scores, and recommendations.
        """
        fraud_prob = ai_result.get("fraud_probability", 0)
        classification = ai_result.get("classification", "GENUINE")
        confidence = ai_result.get("confidence", 0)
        source_type = preprocessed.get("source_type", "general")

        # Apply source-type risk adjustments
        fraud_prob = self._apply_source_adjustment(fraud_prob, source_type, preprocessed)

        # Re-classify after adjustments
        if fraud_prob >= self.FRAUD_THRESHOLD:
            classification = "FRAUD"
        elif fraud_prob >= self.SUSPICIOUS_THRESHOLD:
            classification = "SUSPICIOUS"
        else:
            classification = "GENUINE"

        # Determine risk level
        risk_level = self._get_risk_level(fraud_prob)

        # Generate reasons list (human-readable)
        reasons = self._compile_reasons(ai_result, preprocessed)

        # Generate actionable suggestion
        suggestion = self._generate_suggestion(classification, risk_level, ai_result, source_type)

        return {
            "status": classification,
            "fraud_probability": round(fraud_prob, 1),
            "confidence": round(confidence, 1),
            "risk_level": risk_level["name"],
            "risk_color": risk_level["color"],
            "reasons": reasons,
            "suggestion": suggestion,
            "explanation": ai_result.get("explanation", ""),
            "analysis_details": {
                "intent": ai_result.get("analysis", {}).get("intent", {}),
                "tone": ai_result.get("analysis", {}).get("tone", {}),
                "manipulation": ai_result.get("analysis", {}).get("manipulation_patterns", {}),
                "sentiment": ai_result.get("analysis", {}).get("sentiment", {}),
            },
            "metadata_flags": ai_result.get("metadata_flags", []),
            "source_type": source_type,
            "timestamp": datetime.now().isoformat(),
        }

    def _apply_source_adjustment(self, fraud_prob: float, source_type: str, preprocessed: Dict) -> float:
        """
        Adjust fraud probability based on source type and metadata.
        VoIP calls and SMS from unknown senders get risk boosts.
        """
        metadata = preprocessed.get("metadata", {})

        # Internet/VoIP calls are inherently higher risk
        if source_type == "internet_call":
            fraud_prob = fraud_prob * 1.15  # 15% boost

        # SMS with shortened URLs
        if source_type == "sms" and metadata.get("has_shortened_url"):
            fraud_prob = fraud_prob * 1.20  # 20% boost

        # Extreme caps ratio (shouting)
        if metadata.get("caps_ratio", 0) > 0.7:
            fraud_prob += 5.0

        # Multiple URLs in SMS (unusual)
        if source_type == "sms" and metadata.get("url_count", 0) > 1:
            fraud_prob += 8.0

        return min(fraud_prob, 99.9)  # Cap at 99.9%

    def _get_risk_level(self, fraud_prob: float) -> Dict:
        """Map fraud probability to risk level."""
        for name, config in self.RISK_LEVELS.items():
            if fraud_prob >= config["min"]:
                return {"name": name, "color": config["color"], "action": config["action"]}
        return {"name": "SAFE", "color": "#16a34a", "action": "Appears safe."}

    def _compile_reasons(self, ai_result: Dict, preprocessed: Dict) -> List[str]:
        """Compile all detection reasons into a human-readable list."""
        reasons = []
        analysis = ai_result.get("analysis", {})

        # Intent-based reasons
        intent = analysis.get("intent", {})
        intent_primary = intent.get("primary", "")
        intent_conf = intent.get("confidence", 0)
        malicious_intents = {
            "information theft": "Attempts to steal personal or financial information",
            "money extraction": "Attempts to extract money through deception",
            "identity impersonation": "Impersonates a trusted entity or authority",
            "account verification scam": "False account verification or security alert",
            "emotional manipulation": "Uses emotional pressure to influence decisions",
            "social engineering": "Social engineering tactics to gain trust",
        }
        if intent_primary in malicious_intents and intent_conf > 30:
            reasons.append(malicious_intents[intent_primary])

        # Tone-based reasons
        tone = analysis.get("tone", {})
        tone_reasons = {
            "threatening": "Contains threatening or coercive language",
            "urgent": "Creates artificial urgency or time pressure",
            "manipulative": "Uses manipulative communication patterns",
            "fearful": "Designed to induce fear or panic",
        }
        if tone.get("primary", "") in tone_reasons and tone.get("score", 0) > 40:
            reasons.append(tone_reasons[tone["primary"]])

        # Manipulation patterns
        manipulation = analysis.get("manipulation_patterns", {})
        for pattern in manipulation.get("patterns_detected", [])[:3]:
            if pattern.get("confidence", 0) > 35:
                reasons.append(f"Detected: {pattern['pattern']}")

        # Metadata flags
        for flag in ai_result.get("metadata_flags", []):
            reasons.append(flag)

        # Deduplicate while preserving order
        seen = set()
        unique_reasons = []
        for r in reasons:
            if r not in seen:
                seen.add(r)
                unique_reasons.append(r)

        return unique_reasons

    def _generate_suggestion(
        self, classification: str, risk_level: Dict, 
        ai_result: Dict, source_type: str
    ) -> str:
        """Generate context-aware actionable suggestions."""
        source_label = {
            "sms": "SMS",
            "email": "email",
            "voice_call": "call",
            "internet_call": "call",
        }.get(source_type, "communication")

        if classification == "FRAUD":
            base = f"⛔ HIGH FRAUD RISK: Do not respond to this {source_label}. "
            intent = ai_result.get("analysis", {}).get("intent", {}).get("primary", "")
            
            if intent == "information theft":
                base += "Never share OTP, passwords, or bank details. Report to your bank immediately."
            elif intent == "money extraction":
                base += "Do not transfer any money. This is a financial scam. Contact authorities."
            elif intent == "identity impersonation":
                base += "Verify the sender through official channels. This appears to be an impersonation."
            else:
                base += "Do not click links, share details, or take any action requested. Report as fraud."
            return base

        elif classification == "SUSPICIOUS":
            return (
                f"⚠️ CAUTION: This {source_label} shows suspicious patterns. "
                f"Verify the sender through official channels before taking any action. "
                f"Do not share sensitive information until verified."
            )
        else:
            return (
                f"✅ This {source_label} appears genuine. "
                f"Standard security precautions still apply — "
                f"never share OTP or passwords via {source_label}."
            )
