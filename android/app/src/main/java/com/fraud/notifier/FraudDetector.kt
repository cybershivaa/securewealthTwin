package com.fraud.notifier

enum class FraudLevel { SAFE, SUSPICIOUS, FRAUD }

data class DetectionResult(val level: FraudLevel, val reason: String)

object FraudDetector {
    private val fraudKeywords = listOf("otp", "share code", "verify account", "bank details", "password", "blocked", "cvv", "pin code", "login")
    private val urgencyKeywords = listOf("immediately", "urgent", "last warning", "strictly prohibited", "action required", "act now")
    private val moneyKeywords = listOf("send money", "wire transfer", "western union", "bitcoin", "crypto", "deposit", "gift card", "cash app", "venmo", "zelle", "rs", "rupees", "bucks")

    fun analyze(text: String): DetectionResult {
        val lowerText = text.lowercase()
        
        val fraudMatch = fraudKeywords.filter { lowerText.contains(it) }
        val urgencyMatch = urgencyKeywords.filter { lowerText.contains(it) }
        val moneyMatch = moneyKeywords.filter { lowerText.contains(it) }

        val score = (fraudMatch.size * 2) + (urgencyMatch.size * 1) + (moneyMatch.size * 2)

        return when {
            score >= 4 -> DetectionResult(FraudLevel.FRAUD, "High Risk: Multiple fraud indicators detected (${fraudMatch.joinToString()} ${moneyMatch.joinToString()}).")
            score >= 2 -> DetectionResult(FraudLevel.SUSPICIOUS, "Suspicious: Potential fraud attempt detected.")
            else -> DetectionResult(FraudLevel.SAFE, "Likely Genuine")
        }
    }
}

