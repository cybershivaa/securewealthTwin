"""
Continuous Learning Pipeline
=============================
Handles user feedback collection, false positive correction,
and model improvement tracking for ongoing accuracy enhancement.
"""

import json
import logging
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)


class FeedbackStore:
    """
    Persists user feedback for continuous model improvement.
    Stores corrections, false positives/negatives, and aggregated stats.
    """

    def __init__(self, storage_path: Optional[str] = None):
        if storage_path:
            self._path = Path(storage_path)
        else:
            self._path = Path(__file__).parent.parent.parent / "feedback_data"
        self._path.mkdir(exist_ok=True)
        self._feedback_file = self._path / "feedback_log.json"
        self._stats_file = self._path / "feedback_stats.json"
        self._corrections_file = self._path / "corrections.json"

        # Initialize files if they don't exist
        for f in [self._feedback_file, self._stats_file, self._corrections_file]:
            if not f.exists():
                f.write_text("[]" if f != self._stats_file else "{}")

    def record_feedback(self, feedback: Dict) -> Dict:
        """
        Record user feedback on an analysis result.
        
        Args:
            feedback: {
                "original_text": str,
                "source_type": str,
                "ai_classification": str,  (what the AI said)
                "user_classification": str, (what the user says it should be)
                "is_correct": bool,
                "user_comment": str (optional),
            }
        
        Returns:
            Confirmation with feedback ID
        """
        entry = {
            "id": int(datetime.now().timestamp() * 1000),
            "timestamp": datetime.now().isoformat(),
            "original_text": feedback.get("original_text", ""),
            "source_type": feedback.get("source_type", "general"),
            "ai_classification": feedback.get("ai_classification", ""),
            "user_classification": feedback.get("user_classification", ""),
            "is_correct": feedback.get("is_correct", True),
            "user_comment": feedback.get("user_comment", ""),
            "fraud_probability": feedback.get("fraud_probability", 0),
        }

        # Append to feedback log
        try:
            data = json.loads(self._feedback_file.read_text())
        except (json.JSONDecodeError, FileNotFoundError):
            data = []

        data.append(entry)
        self._feedback_file.write_text(json.dumps(data, indent=2))

        # Track as correction if user disagrees
        if not entry["is_correct"]:
            self._record_correction(entry)

        # Update aggregate stats
        self._update_stats(entry)

        logger.info(f"Feedback recorded: ID={entry['id']}, correct={entry['is_correct']}")
        return {
            "feedback_id": entry["id"],
            "recorded": True,
            "message": "Thank you for your feedback. This helps improve our fraud detection accuracy."
        }

    def get_stats(self) -> Dict:
        """Return aggregate feedback statistics."""
        try:
            stats = json.loads(self._stats_file.read_text())
        except (json.JSONDecodeError, FileNotFoundError):
            stats = {}

        total = stats.get("total_feedback", 0)
        correct = stats.get("correct_count", 0)
        accuracy = (correct / total * 100) if total > 0 else 100.0

        return {
            "total_feedback": total,
            "correct_predictions": correct,
            "incorrect_predictions": stats.get("incorrect_count", 0),
            "accuracy_from_feedback": round(accuracy, 1),
            "false_positives": stats.get("false_positives", 0),
            "false_negatives": stats.get("false_negatives", 0),
            "by_source_type": stats.get("by_source_type", {}),
            "last_updated": stats.get("last_updated", ""),
        }

    def get_corrections(self, limit: int = 50) -> List[Dict]:
        """Return recent corrections for review or retraining."""
        try:
            data = json.loads(self._corrections_file.read_text())
        except (json.JSONDecodeError, FileNotFoundError):
            data = []
        return data[-limit:]

    def get_training_candidates(self) -> List[Dict]:
        """
        Extract correction data formatted for potential fine-tuning.
        Returns text + correct label pairs.
        """
        corrections = self.get_corrections(limit=500)
        candidates = []
        for c in corrections:
            candidates.append({
                "text": c.get("original_text", ""),
                "label": c.get("user_classification", ""),
                "source_type": c.get("source_type", ""),
            })
        return candidates

    def _record_correction(self, entry: Dict):
        """Store a correction (disagreement) for retraining purposes."""
        try:
            data = json.loads(self._corrections_file.read_text())
        except (json.JSONDecodeError, FileNotFoundError):
            data = []

        data.append({
            "id": entry["id"],
            "timestamp": entry["timestamp"],
            "original_text": entry["original_text"],
            "source_type": entry["source_type"],
            "ai_said": entry["ai_classification"],
            "user_said": entry["user_classification"],
            "comment": entry.get("user_comment", ""),
        })
        self._corrections_file.write_text(json.dumps(data, indent=2))

    def _update_stats(self, entry: Dict):
        """Update aggregate statistics."""
        try:
            stats = json.loads(self._stats_file.read_text())
            if isinstance(stats, list):
                stats = {}
        except (json.JSONDecodeError, FileNotFoundError):
            stats = {}

        stats["total_feedback"] = stats.get("total_feedback", 0) + 1

        if entry["is_correct"]:
            stats["correct_count"] = stats.get("correct_count", 0) + 1
        else:
            stats["incorrect_count"] = stats.get("incorrect_count", 0) + 1

            # Track false positive vs false negative
            ai_class = entry.get("ai_classification", "")
            user_class = entry.get("user_classification", "")
            if ai_class in ["FRAUD", "SUSPICIOUS"] and user_class == "GENUINE":
                stats["false_positives"] = stats.get("false_positives", 0) + 1
            elif ai_class == "GENUINE" and user_class in ["FRAUD", "SUSPICIOUS"]:
                stats["false_negatives"] = stats.get("false_negatives", 0) + 1

        # Track by source type
        source = entry.get("source_type", "general")
        if "by_source_type" not in stats:
            stats["by_source_type"] = {}
        if source not in stats["by_source_type"]:
            stats["by_source_type"][source] = {"total": 0, "correct": 0, "incorrect": 0}
        stats["by_source_type"][source]["total"] += 1
        if entry["is_correct"]:
            stats["by_source_type"][source]["correct"] += 1
        else:
            stats["by_source_type"][source]["incorrect"] += 1

        stats["last_updated"] = datetime.now().isoformat()
        self._stats_file.write_text(json.dumps(stats, indent=2))
