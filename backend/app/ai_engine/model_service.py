"""
AI Model Service — Hybrid Architecture
========================================
Uses HuggingFace Inference API for transformer-based analysis
with a sophisticated local NLP fallback for offline scenarios.
Zero local model storage required.
"""

import os
import re
import json
import logging
import math
from typing import Dict, List, Optional
from collections import Counter

import requests as http_requests

logger = logging.getLogger(__name__)

_model_ready = False
_api_available = False

HF_API_URL = "https://api-inference.huggingface.co/models"
HF_ZSC_MODEL = "valhalla/distilbart-mnli-12-3"
HF_SENTIMENT_MODEL = "distilbert-base-uncased-finetuned-sst-2-english"

FRAUD_LABELS = [
    "phishing scam", "legitimate message", "urgency manipulation",
    "threat and intimidation", "social engineering",
    "financial fraud", "prize or lottery scam", "genuine notification",
]

INTENT_LABELS = [
    "information theft", "money extraction", "identity impersonation",
    "legitimate communication", "account verification scam",
    "emotional manipulation", "social engineering", "genuine notification",
]

TONE_LABELS = [
    "threatening", "urgent", "fearful", "professional",
    "casual", "manipulative", "authoritative", "friendly",
]

MANIPULATION_PATTERNS = [
    "creates artificial urgency or time pressure",
    "threatens negative consequences for inaction",
    "impersonates a trusted authority or institution",
    "offers unrealistic rewards or prizes",
    "requests sensitive credentials or financial information",
    "uses emotional pressure or guilt",
    "creates a false sense of exclusivity",
    "normal conversational communication",
]

# --- Local NLP Fraud Corpus for fallback ---
FRAUD_SEMANTIC_VECTORS = {
    "urgency": {
        "terms": ["urgent", "immediately", "right now", "act now", "hurry", "expires",
                  "limited time", "deadline", "within hours", "today only", "last chance",
                  "don't delay", "time sensitive", "action required", "final notice",
                  "before it's too late", "running out", "quick", "asap", "now"],
        "weight": 2.0, "category": "urgency_manipulation"
    },
    "threat": {
        "terms": ["suspend", "block", "disable", "terminate", "arrest", "warrant",
                  "legal action", "penalty", "fine", "prosecute", "police", "court",
                  "locked", "restricted", "unauthorized", "compromised", "breach",
                  "violation", "illegal", "criminal", "shut down", "close your account"],
        "weight": 2.5, "category": "threat_intimidation"
    },
    "credential_request": {
        "terms": ["otp", "password", "pin", "cvv", "ssn", "social security",
                  "bank details", "account number", "routing number", "card number",
                  "verify your identity", "confirm your details", "login credentials",
                  "security code", "verification code", "access code", "secret question",
                  "mother's maiden", "date of birth"],
        "weight": 3.5, "category": "phishing"
    },
    "money_request": {
        "terms": ["send money", "wire transfer", "western union", "bitcoin", "crypto",
                  "gift card", "cash app", "venmo", "zelle", "deposit", "transfer funds",
                  "pay now", "payment required", "outstanding balance", "money gram",
                  "prepaid card", "itunes card", "google play card"],
        "weight": 4.0, "category": "financial_fraud"
    },
    "impersonation": {
        "terms": ["this is the police", "calling from the bank", "irs", "tax department",
                  "government agency", "microsoft support", "apple support", "tech support",
                  "customer service", "security department", "fraud department",
                  "we have detected", "your account has been", "official notice",
                  "on behalf of", "authorized representative"],
        "weight": 2.5, "category": "social_engineering"
    },
    "reward_bait": {
        "terms": ["you won", "congratulations", "winner", "lottery", "prize", "reward",
                  "free gift", "lucky draw", "selected", "chosen", "exclusive offer",
                  "claim now", "collect your", "million dollars", "cash prize",
                  "guaranteed winner", "no purchase necessary"],
        "weight": 3.0, "category": "lottery_scam"
    },
    "link_bait": {
        "terms": ["click here", "click the link", "visit this", "go to", "open this",
                  "download", "install", "update now", "verify at", "confirm at",
                  "log in at", "sign in at", "reset your password at"],
        "weight": 1.5, "category": "phishing"
    },
    "emotional_pressure": {
        "terms": ["please help", "i'm stuck", "emergency", "desperate", "stranded",
                  "hospital", "accident", "life or death", "only you can help",
                  "don't tell anyone", "keep this between us", "trust me",
                  "i need you", "family emergency", "medical emergency"],
        "weight": 2.0, "category": "emotional_manipulation"
    },
}

GENUINE_INDICATORS = {
    "terms": ["monthly statement", "your order", "shipping update", "delivery",
              "receipt", "confirmation", "scheduled maintenance", "newsletter",
              "subscription", "reminder", "appointment", "meeting", "dinner",
              "how are you", "thank you for your purchase", "no action required",
              "for your records", "attached invoice", "payslip"],
    "weight": -2.0,
}


def initialize_models(force_reload: bool = False):
    """Test API availability."""
    global _model_ready, _api_available
    if _model_ready and not force_reload:
        return
    try:
        r = http_requests.post(
            f"{HF_API_URL}/{HF_ZSC_MODEL}",
            json={"inputs": "test", "parameters": {"candidate_labels": ["test"]}},
            timeout=15,
        )
        _api_available = r.status_code in (200, 503)  # 503 = model loading
        logger.info(f"HuggingFace API available: {_api_available} (status={r.status_code})")
    except Exception as e:
        _api_available = False
        logger.warning(f"HuggingFace API not reachable: {e}")
    _model_ready = True
    logger.info(f"AI engine ready (API={'online' if _api_available else 'offline/local fallback'})")


def is_model_ready() -> bool:
    return _model_ready


def _hf_zero_shot(text: str, labels: List[str], multi_label: bool = True) -> Optional[Dict]:
    """Call HuggingFace Inference API for zero-shot classification."""
    try:
        r = http_requests.post(
            f"{HF_API_URL}/{HF_ZSC_MODEL}",
            json={
                "inputs": text[:1024],
                "parameters": {"candidate_labels": labels, "multi_label": multi_label},
            },
            timeout=30,
        )
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, dict) and "labels" in data:
                return data
        logger.warning(f"HF API returned {r.status_code}")
    except Exception as e:
        logger.warning(f"HF API call failed: {e}")
    return None


def _hf_sentiment(text: str) -> Optional[Dict]:
    """Call HuggingFace Inference API for sentiment analysis."""
    try:
        r = http_requests.post(
            f"{HF_API_URL}/{HF_SENTIMENT_MODEL}",
            json={"inputs": text[:512]},
            timeout=15,
        )
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, list) and len(data) > 0:
                if isinstance(data[0], list):
                    data = data[0]
                return {"label": data[0]["label"], "score": data[0]["score"]}
    except Exception as e:
        logger.warning(f"HF sentiment API failed: {e}")
    return None


class LocalNLPEngine:
    """Sophisticated local NLP engine using TF-IDF-like semantic matching."""

    def __init__(self):
        self._all_terms = set()
        for cat in FRAUD_SEMANTIC_VECTORS.values():
            self._all_terms.update(cat["terms"])
        self._all_terms.update(GENUINE_INDICATORS["terms"])

    def compute_fraud_signals(self, text: str) -> Dict[str, float]:
        t = text.lower()
        words = set(re.findall(r'\b\w+\b', t))
        signals = {}
        for label in FRAUD_LABELS:
            signals[label] = 0.0

        category_map = {
            "urgency_manipulation": "urgency manipulation",
            "threat_intimidation": "threat and intimidation",
            "phishing": "phishing scam",
            "financial_fraud": "financial fraud",
            "social_engineering": "social engineering",
            "lottery_scam": "prize or lottery scam",
            "emotional_manipulation": "urgency manipulation",
        }

        total_fraud_score = 0.0
        for cat_name, cat_data in FRAUD_SEMANTIC_VECTORS.items():
            matches = sum(1 for term in cat_data["terms"] if term in t)
            if matches > 0:
                ratio = min(matches / max(len(cat_data["terms"]) * 0.15, 1), 1.0)
                score = ratio * 0.85
                mapped = category_map.get(cat_data["category"], "phishing scam")
                signals[mapped] = max(signals.get(mapped, 0), score)
                total_fraud_score += score

        # Genuine signals
        genuine_matches = sum(1 for term in GENUINE_INDICATORS["terms"] if term in t)
        if genuine_matches > 0:
            g_ratio = min(genuine_matches / 3.0, 1.0)
            signals["legitimate message"] = g_ratio * 0.8
            signals["genuine notification"] = g_ratio * 0.7

        if total_fraud_score < 0.1 and genuine_matches == 0:
            signals["legitimate message"] = 0.4
            signals["genuine notification"] = 0.35

        return signals

    def detect_intent(self, text: str) -> Dict:
        t = text.lower()
        scores = {}
        intent_map = {
            "credential_request": "information theft",
            "money_request": "money extraction",
            "impersonation": "identity impersonation",
            "reward_bait": "emotional manipulation",
            "link_bait": "account verification scam",
            "emotional_pressure": "emotional manipulation",
            "threat": "social engineering",
        }
        for cat_name, cat_data in FRAUD_SEMANTIC_VECTORS.items():
            matches = sum(1 for term in cat_data["terms"] if term in t)
            if matches > 0 and cat_name in intent_map:
                intent = intent_map[cat_name]
                ratio = min(matches / max(len(cat_data["terms"]) * 0.2, 1), 1.0)
                scores[intent] = max(scores.get(intent, 0), ratio * 85)

        if not scores:
            scores["legitimate communication"] = 70
            scores["genuine notification"] = 60

        for label in INTENT_LABELS:
            if label not in scores:
                scores[label] = 5.0

        sorted_intents = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return {
            "primary": sorted_intents[0][0],
            "confidence": round(sorted_intents[0][1], 1),
            "all_scores": {k: round(v, 1) for k, v in scores.items()},
        }

    def analyze_tone(self, text: str) -> Dict:
        t = text.lower()
        tone_scores = {tone: 10.0 for tone in TONE_LABELS}

        threat_terms = FRAUD_SEMANTIC_VECTORS["threat"]["terms"]
        urgency_terms = FRAUD_SEMANTIC_VECTORS["urgency"]["terms"]
        emotional_terms = FRAUD_SEMANTIC_VECTORS["emotional_pressure"]["terms"]

        if any(term in t for term in threat_terms):
            tone_scores["threatening"] = 75
            tone_scores["authoritative"] = 60
        if any(term in t for term in urgency_terms):
            tone_scores["urgent"] = 80
        if any(term in t for term in emotional_terms):
            tone_scores["manipulative"] = 70
            tone_scores["fearful"] = 55

        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        if caps_ratio > 0.4:
            tone_scores["urgent"] = max(tone_scores["urgent"], 65)

        excl = text.count("!")
        if excl > 2:
            tone_scores["urgent"] = max(tone_scores["urgent"], 60)

        if not any(term in t for term in threat_terms + urgency_terms + emotional_terms):
            tone_scores["casual"] = 65
            tone_scores["friendly"] = 55
            tone_scores["professional"] = 50

        sorted_tones = sorted(tone_scores.items(), key=lambda x: x[1], reverse=True)
        return {
            "primary": sorted_tones[0][0],
            "score": round(sorted_tones[0][1], 1),
            "all_tones": [{"tone": t, "score": round(s, 1)} for t, s in sorted_tones[:3]],
        }

    def detect_manipulation(self, text: str) -> Dict:
        t = text.lower()
        detected = []
        pattern_map = {
            "urgency": "creates artificial urgency or time pressure",
            "threat": "threatens negative consequences for inaction",
            "impersonation": "impersonates a trusted authority or institution",
            "reward_bait": "offers unrealistic rewards or prizes",
            "credential_request": "requests sensitive credentials or financial information",
            "emotional_pressure": "uses emotional pressure or guilt",
        }
        for cat_name, pattern_label in pattern_map.items():
            cat_data = FRAUD_SEMANTIC_VECTORS[cat_name]
            matches = sum(1 for term in cat_data["terms"] if term in t)
            if matches > 0:
                conf = min(matches / max(len(cat_data["terms"]) * 0.15, 1), 1.0) * 80
                detected.append({"pattern": pattern_label, "confidence": round(conf, 1)})

        return {
            "patterns_detected": detected,
            "count": len(detected),
            "is_manipulative": len(detected) > 0,
        }

    def analyze_sentiment(self, text: str) -> Dict:
        t = text.lower()
        negative_words = ["block", "suspend", "arrest", "penalty", "urgent", "warning",
                          "threat", "danger", "risk", "fraud", "scam", "illegal", "stolen"]
        positive_words = ["thank", "welcome", "congratulations", "happy", "safe",
                          "secure", "confirmed", "successful", "approved", "ready"]

        neg_count = sum(1 for w in negative_words if w in t)
        pos_count = sum(1 for w in positive_words if w in t)

        if neg_count > pos_count:
            return {"label": "NEGATIVE", "score": round(min(55 + neg_count * 8, 95), 1)}
        elif pos_count > neg_count:
            return {"label": "POSITIVE", "score": round(min(55 + pos_count * 8, 95), 1)}
        return {"label": "NEUTRAL", "score": 52.0}


class SemanticFraudAnalyzer:
    """Multi-dimensional semantic fraud analyzer using HF API + local fallback."""

    def __init__(self):
        self._local = LocalNLPEngine()
        if not _model_ready:
            initialize_models()

    def analyze(self, preprocessed_data: Dict) -> Dict:
        text = preprocessed_data.get("model_input", "")
        metadata = preprocessed_data.get("metadata", {})
        source_type = preprocessed_data.get("source_type", "general")

        if not text or len(text.strip()) < 3:
            return self._empty_result()

        # Try HF API first, fallback to local
        if _api_available:
            fraud_signals = self._api_fraud_signals(text)
            intent = self._api_intent(text)
            tone = self._api_tone(text)
            manipulation = self._api_manipulation(text)
            sentiment = self._api_sentiment(text)
        else:
            fraud_signals = self._local.compute_fraud_signals(text)
            intent = self._local.detect_intent(text)
            tone = self._local.analyze_tone(text)
            manipulation = self._local.detect_manipulation(text)
            sentiment = self._local.analyze_sentiment(text)

        fraud_score = self._compute_fraud_score(fraud_signals, intent, tone, manipulation, sentiment, metadata)
        classification = self._classify(fraud_score)
        explanation = self._generate_explanation(fraud_signals, intent, tone, manipulation, sentiment, metadata, classification, source_type)

        return {
            "classification": classification,
            "fraud_probability": round(fraud_score * 100, 1),
            "confidence": round(self._compute_confidence(fraud_signals, intent, tone), 1),
            "analysis": {
                "intent": intent,
                "tone": tone,
                "manipulation_patterns": manipulation,
                "sentiment": sentiment,
                "fraud_signals": fraud_signals,
            },
            "explanation": explanation,
            "metadata_flags": self._flag_metadata(metadata),
            "source_type": source_type,
        }

    def _api_fraud_signals(self, text: str) -> Dict:
        result = _hf_zero_shot(text, FRAUD_LABELS, multi_label=True)
        if result:
            return dict(zip(result["labels"], result["scores"]))
        return self._local.compute_fraud_signals(text)

    def _api_intent(self, text: str) -> Dict:
        result = _hf_zero_shot(text, INTENT_LABELS, multi_label=False)
        if result:
            return {
                "primary": result["labels"][0],
                "confidence": round(result["scores"][0] * 100, 1),
                "all_scores": dict(zip(result["labels"], [round(s * 100, 1) for s in result["scores"]])),
            }
        return self._local.detect_intent(text)

    def _api_tone(self, text: str) -> Dict:
        result = _hf_zero_shot(text, TONE_LABELS, multi_label=True)
        if result:
            top = [{"tone": l, "score": round(s * 100, 1)} for l, s in zip(result["labels"][:3], result["scores"][:3])]
            return {"primary": result["labels"][0], "score": round(result["scores"][0] * 100, 1), "all_tones": top}
        return self._local.analyze_tone(text)

    def _api_manipulation(self, text: str) -> Dict:
        result = _hf_zero_shot(text, MANIPULATION_PATTERNS, multi_label=True)
        if result:
            detected = []
            for l, s in zip(result["labels"], result["scores"]):
                if s > 0.3 and l != "normal conversational communication":
                    detected.append({"pattern": l, "confidence": round(s * 100, 1)})
            return {"patterns_detected": detected, "count": len(detected), "is_manipulative": len(detected) > 0}
        return self._local.detect_manipulation(text)

    def _api_sentiment(self, text: str) -> Dict:
        result = _hf_sentiment(text)
        if result:
            return {"label": result["label"], "score": round(result["score"] * 100, 1)}
        return self._local.analyze_sentiment(text)

    def _compute_fraud_score(self, fraud_signals, intent, tone, manipulation, sentiment, metadata) -> float:
        score = 0.0
        fraud_cats = ["phishing scam", "urgency manipulation", "threat and intimidation",
                      "social engineering", "financial fraud", "prize or lottery scam"]
        genuine_cats = ["legitimate message", "genuine notification"]

        fraud_avg = sum(fraud_signals.get(c, 0) for c in fraud_cats) / max(len(fraud_cats), 1)
        genuine_avg = sum(fraud_signals.get(c, 0) for c in genuine_cats) / max(len(genuine_cats), 1)
        signal_score = max(0, fraud_avg - genuine_avg * 0.5)
        score += signal_score * 0.35

        malicious = ["information theft", "money extraction", "identity impersonation",
                     "account verification scam", "emotional manipulation", "social engineering"]
        if intent.get("primary", "") in malicious:
            score += (intent.get("confidence", 0) / 100.0) * 0.25

        threatening = ["threatening", "urgent", "manipulative", "fearful"]
        if tone.get("primary", "") in threatening:
            score += (tone.get("score", 0) / 100.0) * 0.15

        if manipulation.get("is_manipulative"):
            score += min(manipulation.get("count", 0) / 3.0, 1.0) * 0.15

        meta_score = 0.0
        if metadata.get("has_shortened_url"): meta_score += 0.3
        if metadata.get("url_count", 0) > 0: meta_score += 0.15
        if metadata.get("caps_ratio", 0) > 0.5: meta_score += 0.15
        if metadata.get("has_time_pressure"): meta_score += 0.2
        if metadata.get("exclamation_count", 0) > 3: meta_score += 0.1
        score += min(meta_score, 1.0) * 0.10

        return min(max(score, 0.0), 1.0)

    def _classify(self, fraud_score: float) -> str:
        if fraud_score >= 0.55: return "FRAUD"
        if fraud_score >= 0.30: return "SUSPICIOUS"
        return "GENUINE"

    def _compute_confidence(self, fraud_signals, intent, tone) -> float:
        confs = []
        if fraud_signals:
            confs.append(max(fraud_signals.values(), default=0) * 100)
        if intent.get("confidence", 0) > 0:
            confs.append(intent["confidence"])
        if tone.get("score", 0) > 0:
            confs.append(tone["score"])
        return sum(confs) / len(confs) if confs else 0.0

    def _flag_metadata(self, metadata: Dict) -> List[str]:
        flags = []
        if metadata.get("has_shortened_url"): flags.append("Contains shortened/obfuscated URL")
        if metadata.get("url_count", 0) > 2: flags.append(f"Contains {metadata['url_count']} external URLs")
        elif metadata.get("url_count", 0) > 0: flags.append("Contains external URL")
        if metadata.get("caps_ratio", 0) > 0.5: flags.append("Excessive use of capital letters (shouting)")
        if metadata.get("has_time_pressure"): flags.append("Contains time-pressure language")
        if metadata.get("exclamation_count", 0) > 3: flags.append("Excessive exclamation marks")
        return flags

    def _generate_explanation(self, fraud_signals, intent, tone, manipulation, sentiment, metadata, classification, source_type) -> str:
        src = {"sms": "SMS message", "email": "email", "voice_call": "voice call transcript",
               "internet_call": "internet call transcript"}.get(source_type, "communication")

        if classification == "GENUINE":
            return (f"This {src} appears to be a genuine communication. "
                    f"The primary intent is '{intent.get('primary', 'unknown')}' "
                    f"with a {tone.get('primary', 'neutral')} tone. No significant manipulation patterns found.")

        parts = [f"This {src} shows signs of potential fraud."]
        p_intent = intent.get("primary", "")
        if p_intent and intent.get("confidence", 0) > 30:
            parts.append(f"The detected intent is '{p_intent}' (confidence: {intent['confidence']}%).")
        p_tone = tone.get("primary", "")
        if p_tone in ["threatening", "urgent", "manipulative", "fearful"]:
            parts.append(f"The tone is {p_tone}, commonly used in phishing communications.")
        patterns = manipulation.get("patterns_detected", [])
        if patterns:
            names = [p["pattern"] for p in patterns[:3]]
            parts.append(f"Manipulation patterns: {'; '.join(names)}.")
        fraud_cats = ["phishing scam", "urgency manipulation", "threat and intimidation",
                      "social engineering", "financial fraud", "prize or lottery scam"]
        top = sorted([(k, v) for k, v in fraud_signals.items() if k in fraud_cats and v > 0.3],
                     key=lambda x: x[1], reverse=True)[:2]
        if top:
            parts.append(f"Key signals: {', '.join(f'{s[0]} ({round(s[1]*100)}%)' for s in top)}.")
        mf = self._flag_metadata(metadata)
        if mf:
            parts.append(f"Additional indicators: {'; '.join(mf)}.")
        return " ".join(parts)

    def _empty_result(self) -> Dict:
        return {
            "classification": "GENUINE", "fraud_probability": 0.0, "confidence": 0.0,
            "analysis": {
                "intent": {"primary": "unknown", "confidence": 0, "all_scores": {}},
                "tone": {"primary": "unknown", "score": 0, "all_tones": []},
                "manipulation_patterns": {"patterns_detected": [], "count": 0, "is_manipulative": False},
                "sentiment": {"label": "NEUTRAL", "score": 50.0},
                "fraud_signals": {},
            },
            "explanation": "Insufficient text for analysis.",
            "metadata_flags": [], "source_type": "unknown",
        }
