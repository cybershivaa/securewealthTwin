"""
Fraud Notifier API — AI-Powered Semantic Analysis Engine
=========================================================
Replaces keyword-based detection with transformer-powered NLP
for intent, tone, urgency, manipulation, and phishing detection.
"""

import re
import logging
import threading
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# --- AI Engine Imports ---
from app.ai_engine.preprocessor import TextPreprocessor
from app.ai_engine.model_service import SemanticFraudAnalyzer, initialize_models, is_model_ready
from app.ai_engine.scoring_engine import FraudScoringEngine
from app.ai_engine.feedback_pipeline import FeedbackStore

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- App ---
app = FastAPI(
    title="Fraud Notifier — AI Semantic Analysis Engine",
    description="NLP-powered fraud detection using transformer models for semantic analysis of SMS, emails, calls, and VoIP communications.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Singleton Services ---
preprocessor = TextPreprocessor()
scoring_engine = FraudScoringEngine()
feedback_store = FeedbackStore()

# AI model is lazy-loaded on first request or via startup event
_analyzer: Optional[SemanticFraudAnalyzer] = None
_model_loading = False
_model_lock = threading.Lock()


def get_analyzer() -> SemanticFraudAnalyzer:
    """Thread-safe lazy initialization of the AI analyzer."""
    global _analyzer, _model_loading
    if _analyzer is not None:
        return _analyzer
    with _model_lock:
        if _analyzer is not None:
            return _analyzer
        _model_loading = True
        logger.info("Initializing AI models (first request)...")
        _analyzer = SemanticFraudAnalyzer()
        _model_loading = False
        logger.info("AI models ready.")
        return _analyzer


# --- Request/Response Models ---

class MessageAnalyzeRequest(BaseModel):
    message_text: str
    source_type: str = Field(default="email", description="One of: sms, email, voice_call, internet_call")

class CallAnalyzeRequest(BaseModel):
    caller_number: str
    call_type: str = Field(default="voice", description="voice or internet")
    call_transcript: str

class FeedbackRequest(BaseModel):
    original_text: str
    source_type: str = "general"
    ai_classification: str
    user_classification: str = Field(description="GENUINE, SUSPICIOUS, or FRAUD")
    is_correct: bool
    user_comment: Optional[str] = ""
    fraud_probability: Optional[float] = 0

class BulkAnalyzeItem(BaseModel):
    text: str
    source_type: str = "email"
    sender: Optional[str] = "Unknown"
    item_id: Optional[int] = None


# --- Mock Data ---

MOCK_COMMUNICATIONS = [
    {"id": 1, "sender": "bank@secure.com", "type": "email", "text": "Your monthly statement is ready.", "timestamp": "2023-10-01 10:00 AM"},
    {"id": 2, "sender": "Unknown", "type": "sms", "text": "URGENT: Your account is locked. Click here: http://bit.ly/123", "timestamp": "2023-10-02 11:30 AM"},
    {"id": 3, "sender": "Netflix", "type": "email", "text": "New sign-in to your account.", "timestamp": "2023-10-03 02:15 PM"},
    {"id": 4, "sender": "Promo", "type": "sms", "text": "You won the weekly lottery! Claim reward now at http://tinyurl.com/win", "timestamp": "2023-10-03 04:45 PM"},
    {"id": 5, "sender": "Mom", "type": "call", "call_type": "voice", "text": "Hey, when are you coming home for dinner?", "timestamp": "2023-10-04 06:00 PM"},
    {"id": 6, "sender": "Unknown", "type": "call", "call_type": "internet", "text": "This is the police. Your account is blocked. Act now and tell us your OTP.", "timestamp": "2023-10-04 07:20 PM"},
    {"id": 7, "sender": "+1-800-555-0199", "type": "call", "call_type": "voice", "text": "Hi, calling about your warranty. Do you have your bank details handy?", "timestamp": "2023-10-05 09:10 AM"}
]

APP_ACTIVITY_LOGS = [
    {"id": 2, "timestamp": "2026-04-18 11:30 AM", "action": "System: Background SMS scan", "result": "FRAUD"},
    {"id": 1, "timestamp": "2026-04-18 10:00 AM", "action": "System: Background Email scan", "result": "SAFE"},
]


# --- Startup ---

@app.on_event("startup")
async def startup_load_models():
    """Pre-load AI models at startup in a background thread."""
    def _load():
        try:
            get_analyzer()
        except Exception as e:
            logger.error(f"Failed to pre-load AI models: {e}")
    
    thread = threading.Thread(target=_load, daemon=True)
    thread.start()
    logger.info("AI model loading started in background...")


# --- Health / Status ---

@app.get("/health")
def health_check():
    """System health with AI model status."""
    return {
        "status": "online",
        "ai_engine": "ready" if is_model_ready() else ("loading" if _model_loading else "not_loaded"),
        "version": "2.0.0 — Semantic AI Engine",
        "capabilities": [
            "intent_detection",
            "tone_analysis",
            "manipulation_detection",
            "phishing_detection",
            "social_engineering_detection",
            "urgency_analysis",
            "confidence_scoring",
            "explainable_output",
        ],
    }


# --- Dashboard ---

@app.get("/get-dashboard-data")
def get_dashboard_data():
    """Returns summary for the user Dashboard."""
    feedback_stats = feedback_store.get_stats()
    return {
        "balance": 12500.50,
        "currency": "USD",
        "recent_alerts": 2,
        "total_messages_scanned": 145,
        "safe_messages": 140,
        "fraud_messages": 5,
        "ai_engine_status": "ready" if is_model_ready() else "loading",
        "ai_accuracy": feedback_stats.get("accuracy_from_feedback", 100.0),
        "total_feedback": feedback_stats.get("total_feedback", 0),
    }


# --- AI Message Analysis ---

@app.post("/analyze-message")
def analyze_message(request: MessageAnalyzeRequest):
    """
    AI-powered semantic analysis of a message (SMS or email).
    
    Performs multi-dimensional NLP analysis:
    - Intent detection
    - Tone analysis
    - Manipulation pattern recognition
    - Fraud signal classification
    - Confidence scoring
    - Explainable output
    """
    analyzer = get_analyzer()

    # Step 1: Preprocess
    preprocessed = preprocessor.prepare_for_model(
        request.message_text,
        source_type=request.source_type
    )

    # Step 2: AI Analysis
    ai_result = analyzer.analyze(preprocessed)

    # Step 3: Final Scoring
    final = scoring_engine.score(ai_result, preprocessed)

    # Step 4: Log activity
    APP_ACTIVITY_LOGS.insert(0, {
        "id": len(APP_ACTIVITY_LOGS) + 1,
        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        "action": f"AI Scan: {request.source_type.upper()}",
        "result": final["status"],
    })

    return final


# --- AI Call Analysis ---

@app.post("/analyze-call")
def analyze_call(request: CallAnalyzeRequest):
    """
    AI-powered semantic analysis of a call transcript.
    
    Handles both voice calls and internet/VoIP calls with
    source-specific risk adjustments.
    """
    analyzer = get_analyzer()

    # Determine source type
    source_type = "internet_call" if request.call_type.lower() == "internet" else "voice_call"

    # Step 1: Preprocess
    preprocessed = preprocessor.prepare_for_model(
        request.call_transcript,
        source_type=source_type
    )

    # Step 2: AI Analysis
    ai_result = analyzer.analyze(preprocessed)

    # Step 3: Final Scoring
    final = scoring_engine.score(ai_result, preprocessed)

    # Step 4: Additional call-specific metadata
    call_meta = {
        "caller_number": request.caller_number,
        "call_type": request.call_type,
        "is_unknown_caller": "unknown" in request.caller_number.lower(),
    }

    # Boost score for unknown callers
    if call_meta["is_unknown_caller"]:
        final["fraud_probability"] = min(final["fraud_probability"] + 5.0, 99.9)
        if "Unknown or hidden caller number" not in final["reasons"]:
            final["reasons"].insert(0, "Unknown or hidden caller number")

    final["call_metadata"] = call_meta

    # Log activity
    APP_ACTIVITY_LOGS.insert(0, {
        "id": len(APP_ACTIVITY_LOGS) + 1,
        "timestamp": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
        "action": f"AI Call Scan: {request.call_type.upper()}",
        "result": final["status"],
    })

    return final


# --- Scan All Communications ---

@app.post("/scan-all")
def scan_all():
    """Reads all communications and passes them through the AI analyzer."""
    analyzer = get_analyzer()
    results = []

    for item in MOCK_COMMUNICATIONS:
        scanned_item = dict(item)

        if item["type"] == "call":
            source_type = "internet_call" if item.get("call_type") == "internet" else "voice_call"
        else:
            source_type = item["type"]

        preprocessed = preprocessor.prepare_for_model(item["text"], source_type=source_type)
        ai_result = analyzer.analyze(preprocessed)
        final = scoring_engine.score(ai_result, preprocessed)

        scanned_item["status"] = final["status"]
        scanned_item["reasons"] = final["reasons"]
        scanned_item["fraud_probability"] = final["fraud_probability"]
        scanned_item["confidence"] = final["confidence"]
        scanned_item["risk_level"] = final["risk_level"]
        scanned_item["explanation"] = final["explanation"]
        scanned_item["suggestion"] = final["suggestion"]
        scanned_item["analysis_details"] = final["analysis_details"]
        results.append(scanned_item)

    return results


# --- Feedback / Continuous Learning ---

@app.post("/feedback")
def submit_feedback(request: FeedbackRequest):
    """
    Submit user feedback on an AI analysis result.
    Enables continuous learning and accuracy improvement.
    """
    return feedback_store.record_feedback(request.dict())


@app.get("/feedback/stats")
def get_feedback_stats():
    """Get aggregate feedback statistics and AI accuracy metrics."""
    return feedback_store.get_stats()


@app.get("/feedback/corrections")
def get_corrections():
    """Get list of user corrections for review."""
    return feedback_store.get_corrections()


# --- Activity Logs ---

@app.get("/get-activity-logs")
def get_activity_logs():
    """Returns logs of past checks."""
    return APP_ACTIVITY_LOGS


@app.get("/get-messages")
def get_messages():
    """Returns a list of emails and SMS."""
    return [c for c in MOCK_COMMUNICATIONS if c["type"] in ["email", "sms"]]


@app.get("/fetch-all-communications")
def fetch_all_communications():
    """Returns all simulated communications."""
    return MOCK_COMMUNICATIONS


# --- AI Model Status ---

@app.get("/ai/status")
def ai_model_status():
    """Detailed AI model status and capabilities."""
    return {
        "model_ready": is_model_ready(),
        "loading": _model_loading,
        "models": {
            "zero_shot_classifier": "valhalla/distilbart-mnli-12-3",
            "sentiment_analyzer": "distilbert-base-uncased-finetuned-sst-2-english",
        },
        "analysis_dimensions": [
            "fraud_signal_classification",
            "intent_detection",
            "tone_analysis",
            "manipulation_pattern_detection",
            "sentiment_analysis",
        ],
        "supported_sources": ["sms", "email", "voice_call", "internet_call"],
        "feedback_stats": feedback_store.get_stats(),
    }
