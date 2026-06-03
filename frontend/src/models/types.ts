export type AppRiskLevel = 'safe' | 'warning' | 'risky';

export interface ScannedApp {
  name: string;
  packageId: string;
  riskLevel: AppRiskLevel;
  reason: string;
}

export interface DeviceScanResult {
  isDeveloperModeOn: boolean;
  isUsbDebuggingOn: boolean;
  isJailbroken: boolean;
  unknownAppsCount: number;
  hasRiskyPermissions: boolean;
  isScreenRecordingDetected: boolean;
  scanTime: string; // ISO string
  scannedApps: ScannedApp[];
  checkTimings: Record<string, number>;
}

export type RiskLevel = 'safe' | 'medium' | 'high';

export interface RiskScore {
  score: number;
  level: RiskLevel;
  reasons: string[];
}

export function isSecure(result: DeviceScanResult): boolean {
  return (
    !result.isDeveloperModeOn &&
    !result.isUsbDebuggingOn &&
    !result.isJailbroken &&
    result.unknownAppsCount === 0 &&
    !result.hasRiskyPermissions &&
    !result.isScreenRecordingDetected
  );
}

export function getCleanScan(): DeviceScanResult {
  return {
    isDeveloperModeOn: false,
    isUsbDebuggingOn: false,
    isJailbroken: false,
    unknownAppsCount: 0,
    hasRiskyPermissions: false,
    isScreenRecordingDetected: false,
    scanTime: new Date().toISOString(),
    scannedApps: [],
    checkTimings: {
      'Jailbreak / Root': 0,
      'Developer Mode': 0,
      'USB Debugging': 0,
      'App Scanning': 0,
      'Screen Recording': 0,
      'Permissions Analysis': 0,
    },
  };
}

export function createRiskScore(score: number, reasons: string[]): RiskScore {
  const clamped = Math.max(0, Math.min(100, score));
  let level: RiskLevel = 'safe';
  
  if (clamped <= 30) {
    level = 'safe';
  } else if (clamped <= 70) {
    level = 'medium';
  } else {
    level = 'high';
  }
  
  return {
    score: clamped,
    level,
    reasons,
  };
}

export function getLevelLabel(level: RiskLevel): string {
  switch (level) {
    case 'safe':
      return 'Safe';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
  }
}

export function isPaymentAllowed(riskScore: RiskScore): boolean {
  return riskScore.level !== 'high';
}
