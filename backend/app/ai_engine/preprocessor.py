"""
Preprocessing Layer
===================
Handles text normalization, cleaning, and feature extraction
before feeding into the transformer model.
"""

import re
import unicodedata
from typing import Dict, List, Optional


class TextPreprocessor:
    """
    Cleans and normalizes raw communication text from various sources
    (SMS, email, voice transcripts, internet calls) for NLP analysis.
    """

    # Common URL shorteners and suspicious TLD patterns
    SUSPICIOUS_URL_PATTERNS = [
        r'bit\.ly', r'tinyurl\.com', r'goo\.gl', r't\.co', r'ow\.ly',
        r'is\.gd', r'buff\.ly', r'adf\.ly', r'tiny\.cc', r'rb\.gy',
        r'shorturl\.at', r'cutt\.ly',
    ]

    # Obfuscation patterns scammers use
    OBFUSCATION_MAP = {
        '@': 'a', '0': 'o', '1': 'i', '3': 'e', '5': 's',
        '$': 's', '!': 'i', '|': 'l',
    }

    def __init__(self):
        self._url_pattern = re.compile(
            r'https?://[^\s<>"{}|\\^`\[\]]+|www\.[^\s<>"{}|\\^`\[\]]+',
            re.IGNORECASE
        )
        self._email_pattern = re.compile(
            r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
            re.IGNORECASE
        )
        self._phone_pattern = re.compile(
            r'[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]{6,15}'
        )

    def clean(self, text: str, source_type: str = "general") -> str:
        """
        Master cleaning pipeline that normalizes text for model input.
        
        Args:
            text: Raw input text
            source_type: One of 'sms', 'email', 'voice_call', 'internet_call'
        
        Returns:
            Cleaned, normalized text string
        """
        if not text or not text.strip():
            return ""

        # Step 1: Unicode normalization
        text = unicodedata.normalize('NFKD', text)

        # Step 2: Source-specific preprocessing
        if source_type == "email":
            text = self._clean_email(text)
        elif source_type == "sms":
            text = self._clean_sms(text)
        elif source_type in ("voice_call", "internet_call"):
            text = self._clean_transcript(text)

        # Step 3: General normalization
        text = self._normalize_whitespace(text)
        text = self._deobfuscate(text)

        return text.strip()

    def extract_metadata(self, text: str) -> Dict:
        """
        Extracts structural metadata features that assist the AI model.
        These features are used alongside transformer embeddings.
        """
        urls = self._url_pattern.findall(text)
        emails = self._email_pattern.findall(text)
        phones = self._phone_pattern.findall(text)

        has_shortened_url = any(
            re.search(pattern, text, re.IGNORECASE)
            for pattern in self.SUSPICIOUS_URL_PATTERNS
        )

        # Count exclamation/question marks (urgency signals)
        exclamation_count = text.count('!')
        question_count = text.count('?')
        caps_ratio = self._calculate_caps_ratio(text)

        # Detect if message has a deadline/timer pressure
        has_time_pressure = bool(re.search(
            r'\b(hours?|minutes?|seconds?|immediately|right now|today|expires?|deadline|within \d+)\b',
            text, re.IGNORECASE
        ))

        return {
            "url_count": len(urls),
            "urls": urls,
            "email_count": len(emails),
            "phone_count": len(phones),
            "has_shortened_url": has_shortened_url,
            "exclamation_count": exclamation_count,
            "question_count": question_count,
            "caps_ratio": caps_ratio,
            "has_time_pressure": has_time_pressure,
            "text_length": len(text),
            "word_count": len(text.split()),
        }

    def prepare_for_model(self, text: str, source_type: str = "general") -> Dict:
        """
        Full preprocessing pipeline: returns cleaned text + metadata features.
        """
        cleaned = self.clean(text, source_type)
        metadata = self.extract_metadata(text)  # Extract from original text
        
        # Construct source-aware prompt for the model
        source_label = {
            "sms": "SMS message",
            "email": "Email message",
            "voice_call": "Voice call transcript",
            "internet_call": "Internet/VoIP call transcript",
        }.get(source_type, "Communication")

        model_input = f"[{source_label}] {cleaned}"

        return {
            "model_input": model_input,
            "cleaned_text": cleaned,
            "original_text": text,
            "metadata": metadata,
            "source_type": source_type,
        }

    # --- Private helpers ---

    def _clean_email(self, text: str) -> str:
        """Remove email headers, signatures, and forwarding artifacts."""
        # Remove common email headers
        text = re.sub(r'^(From|To|Cc|Bcc|Subject|Date|Reply-To):.*$', '', text, flags=re.MULTILINE)
        # Remove signature blocks
        text = re.sub(r'--\s*\n.*', '', text, flags=re.DOTALL)
        # Remove forwarding markers
        text = re.sub(r'[-]{2,}\s*Forwarded message\s*[-]{2,}', '', text)
        # Remove HTML tags if present
        text = re.sub(r'<[^>]+>', ' ', text)
        return text

    def _clean_sms(self, text: str) -> str:
        """Normalize SMS-specific patterns."""
        # Expand common SMS abbreviations relevant to fraud
        sms_expansions = {
            r'\bu\b': 'you', r'\bur\b': 'your', r'\bpls\b': 'please',
            r'\basap\b': 'as soon as possible', r'\bacc\b': 'account',
            r'\bpwd\b': 'password', r'\btxn\b': 'transaction',
            r'\bverify\b': 'verify', r'\bimg\b': 'immediately',
        }
        for pattern, replacement in sms_expansions.items():
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        return text

    def _clean_transcript(self, text: str) -> str:
        """Clean speech-to-text artifacts from call transcripts."""
        # Remove filler words from STT
        fillers = ['um', 'uh', 'hmm', 'ah', 'like', 'you know', 'basically']
        for filler in fillers:
            text = re.sub(rf'\b{filler}\b', '', text, flags=re.IGNORECASE)
        # Normalize repeated words from STT stuttering
        text = re.sub(r'\b(\w+)(\s+\1){2,}\b', r'\1', text)
        return text

    def _deobfuscate(self, text: str) -> str:
        """
        Detect and decode character substitutions used to evade detection.
        E.g., "P@$$w0rd" -> "Password"
        """
        # Only deobfuscate if the text has suspicious character mixing
        if not re.search(r'[A-Za-z].*[@$!|01357].*[A-Za-z]', text):
            return text
        
        result = []
        for char in text:
            if char in self.OBFUSCATION_MAP:
                result.append(self.OBFUSCATION_MAP[char])
            else:
                result.append(char)
        return ''.join(result)

    def _normalize_whitespace(self, text: str) -> str:
        """Collapse multiple whitespace and trim."""
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def _calculate_caps_ratio(self, text: str) -> float:
        """Calculate the ratio of uppercase characters (urgency signal)."""
        alpha_chars = [c for c in text if c.isalpha()]
        if not alpha_chars:
            return 0.0
        return sum(1 for c in alpha_chars if c.isupper()) / len(alpha_chars)
