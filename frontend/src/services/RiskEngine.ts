import { DeviceScanResult, RiskScore, createRiskScore } from '../models/types';

/**
 * Service that implements the rule-based risk scoring engine.
 * 
 * Risk Rules:
 * - +50 → Jailbreak / Root detected
 * - +20 → Developer mode ON
 * - +25 → Unknown apps detected
 * - +15 → Unusual time (before 6 AM or after 11 PM)
 * - +30 → High amount (> ₹20,000)
 * - +25 → Screen recording active
 * 
 * Final Score Ranges:
 * - 0–30  → Safe
 * - 31–70 → Medium Risk
 * - 71–100 → High Risk
 */
export class RiskEngine {
  /**
   * Calculate risk score for a payment transaction.
   */
  static calculateRisk(
    scanResult: DeviceScanResult | null,
    amount: number,
    transactionTime: Date
  ): RiskScore {
    let score = 0;
    const reasons: string[] = [];

    // Rule 1: Jailbreak / Root check (+50)
    if (scanResult && scanResult.isJailbroken) {
      score += 50;
      reasons.push('Device is jailbroken/rooted — severe security risk');
    }

    // Rule 2: Developer mode check (+20)
    if (scanResult && scanResult.isDeveloperModeOn) {
      score += 20;
      reasons.push('Developer mode is enabled');
    }

    // Rule 3: Unknown apps check (+25)
    if (scanResult && scanResult.unknownAppsCount > 0) {
      score += 25;
      reasons.push(`${scanResult.unknownAppsCount} unknown app(s) detected`);
    }

    // Rule 4: Screen recording check (+25)
    if (scanResult && scanResult.isScreenRecordingDetected) {
      score += 25;
      reasons.push('Active screen recording detected — OTPs may be exposed');
    }

    // Rule 5: Unusual time check (+15)
    // Unusual = before 6 AM or after 11 PM
    const hour = transactionTime.getHours();
    if (hour < 6 || hour >= 23) {
      score += 15;
      reasons.push(`Transaction at unusual time (${this.formatTime(transactionTime)})`);
    }

    // Rule 6: High amount check (+30)
    if (amount > 20000) {
      score += 30;
      reasons.push(`High transaction amount (₹${amount.toFixed(0)})`);
    }

    // If no risks found, add a safe reason
    if (reasons.length === 0) {
      reasons.push('No risk factors detected');
    }

    return createRiskScore(score, reasons);
  }

  /**
   * Format time as HH:MM AM/PM
   */
  private static formatTime(time: Date): string {
    const hours24 = time.getHours();
    const minutes = time.getMinutes();
    const period = hours24 >= 12 ? 'PM' : 'AM';
    let hours12 = hours24 % 12;
    hours12 = hours12 === 0 ? 12 : hours12;
    const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours12}:${minutesStr} ${period}`;
  }
}
