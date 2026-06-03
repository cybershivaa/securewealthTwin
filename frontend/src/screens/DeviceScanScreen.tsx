import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, GRADIENTS, getRiskColor } from '../theme/appTheme';
import { useApp } from '../providers/AppProvider';
import { StatusChip } from '../widgets/StatusChip';
import { GradientButton } from '../widgets/GradientButton';
import { RiskGauge } from '../widgets/RiskGauge';

export const DeviceScanScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const {
    scanResult,
    riskScore,
    isScanning: appIsScanning,
    performScan,
    themeMode,
  } = useApp();

  const isDark = themeMode === 'dark';

  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedSuspiciousApps, setExpandedSuspiciousApps] = useState(false);

  const totalSteps = 6;
  const scanSteps = [
    'Reading Root / Jailbreak Status...',
    'Checking Developer Options...',
    'Checking USB Debugging (ADB)...',
    'Scanning Installed Packages...',
    'Detecting Screen Recording...',
    'Analyzing Device Integrity...',
  ];

  // Pulse animation for radar icon
  const pulseValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    
    if (isScanning) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseValue.setValue(0);
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [isScanning, pulseValue]);

  const startScan = async () => {
    setIsScanning(true);
    setScanComplete(false);
    setCurrentStep(0);

    for (let i = 0; i < totalSteps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setCurrentStep(i + 1);
    }

    await performScan();
    setIsScanning(false);
    setScanComplete(true);
  };

  const toggleExpandApps = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSuspiciousApps(!expandedSuspiciousApps);
  };

  // Classify timing row render
  const renderTimingRow = (name: string, ms: number) => (
    <View key={name} style={styles.timingRow}>
      <View style={styles.timingRowLeft}>
        <Text style={styles.checkCircleIcon}>🟢</Text>
        <Text style={[styles.timingLabel, { color: isDark ? 'rgba(255,255,255,0.7)' : '#555' }]}>
          {name}
        </Text>
      </View>
      <Text style={[styles.timingValue, { color: isDark ? 'rgba(255,255,255,0.5)' : '#666' }]}>
        {ms}ms
      </Text>
    </View>
  );

  // App risk card render
  const renderAppCard = (app: any) => {
    let color = COLORS.safe;
    let icon = '🟢';
    let badge = 'Safe';

    if (app.riskLevel === 'warning') {
      color = COLORS.warning;
      icon = '⚠️';
      badge = 'Warning';
    } else if (app.riskLevel === 'risky') {
      color = COLORS.danger;
      icon = '❌';
      badge = 'Risk';
    }

    const cardBg = isDark ? '#1E1E2E' : '#FFFFFF';
    const textColor = isDark ? '#FFFFFF' : '#222222';
    const subTextColor = isDark ? 'rgba(255,255,255,0.4)' : '#666';

    return (
      <View key={app.packageId} style={[styles.appCard, { backgroundColor: cardBg }]}>
        <View style={styles.appCardTop}>
          <View style={[styles.appIconBox, { backgroundColor: `${color}1F` }]}>
            <Text style={{ fontSize: 18 }}>{icon}</Text>
          </View>
          <View style={styles.appTextContainer}>
            <Text style={[styles.appNameText, { color: textColor }]}>{app.name}</Text>
            <Text style={[styles.appPkgText, { color: subTextColor }]}>{app.packageId}</Text>
          </View>
          <View style={[styles.appRiskBadge, { backgroundColor: `${color}1F` }]}>
            <Text style={[styles.appRiskBadgeText, { color }]}>{badge}</Text>
          </View>
        </View>

        {app.riskLevel !== 'safe' && (
          <View style={[styles.appRiskReasonBox, { backgroundColor: `${color}0A`, borderColor: `${color}2B` }]}>
            <Text style={[styles.appRiskReasonText, { color }]}>ℹ️ {app.reason}</Text>
          </View>
        )}
      </View>
    );
  };

  const screenBg = isDark ? '#121220' : '#F5F5FA';
  const cardBg = isDark ? '#1E1E2E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A2E';
  const subTextColor = isDark ? 'rgba(255,255,255,0.6)' : '#666677';
  const sectionTitleColor = isDark ? '#FFFFFF' : '#2D2D3A';

  // Radar circle scale
  const scale = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const getThreatColor = () => {
    if (!scanResult) return COLORS.primary;
    const hasThreats = scanResult.scannedApps.some((a: any) => a.riskLevel !== 'safe');
    return hasThreats ? COLORS.danger : COLORS.safe;
  };

  const flaggedApps = scanResult?.scannedApps.filter((a: any) => a.riskLevel !== 'safe') ?? [];
  const totalThreats = flaggedApps.length;
  const isAllClear = totalThreats === 0;

  const totalTiming = scanResult
    ? Object.values(scanResult.checkTimings).reduce((a: number, b: number) => a + b, 0)
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.appBarTitle, { color: textColor }]}>⬅️  Device Scan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ─── Scan Animation / Icon ─── */}
        <View style={styles.animSection}>
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                transform: [{ scale }],
                backgroundColor: scanComplete
                  ? getThreatColor()
                  : COLORS.primary,
              },
            ]}
          >
            <Text style={styles.pulseIcon}>{scanComplete ? (isAllClear ? '✅' : '⚠️') : '📡'}</Text>
          </Animated.View>
        </View>

        {/* ─── Scan Progress Indicator ─── */}
        {isScanning && (
          <View style={styles.progressContainer}>
            <Text style={[styles.progressLabel, { color: textColor }]}>
              {currentStep < totalSteps ? scanSteps[currentStep] : 'Finalizing...'}
            </Text>
            <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E0E0E0' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${(currentStep / totalSteps) * 100}%`,
                    backgroundColor: COLORS.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressPercent, { color: subTextColor }]}>
              {Math.round((currentStep / totalSteps) * 100)}%
            </Text>
          </View>
        )}

        {!isScanning && !scanComplete && (
          <Text style={[styles.helperText, { color: subTextColor }]}>
            Tap below to start a device security scan
          </Text>
        )}

        {/* ─── Scan Results Output ─── */}
        {scanComplete && scanResult && (
          <View style={styles.resultsContainer}>
            {/* Threat summary banner */}
            <View
              style={[
                styles.threatBanner,
                {
                  backgroundColor: isAllClear ? 'rgba(76, 175, 80, 0.12)' : 'rgba(255, 82, 82, 0.12)',
                  borderColor: isAllClear ? 'rgba(76, 175, 80, 0.4)' : 'rgba(255, 82, 82, 0.4)',
                },
              ]}
            >
              <View style={styles.bannerHeader}>
                <Text style={styles.bannerHeaderIcon}>{isAllClear ? '🟢' : '🛑'}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={[
                      styles.bannerTitle,
                      { color: isAllClear ? COLORS.safe : COLORS.danger },
                    ]}
                  >
                    {isAllClear ? 'All Clear — Device is Safe' : `${totalThreats} Threat${totalThreats > 1 ? 's' : ''} Detected`}
                  </Text>
                  <Text style={[styles.bannerSub, { color: textColor }]}>
                    {isAllClear
                      ? 'No suspicious or malicious apps were found.'
                      : 'These apps pose a risk to your banking data.'}
                  </Text>
                </View>
              </View>

              {/* Show items if risky */}
              {!isAllClear && (
                <View style={styles.threatList}>
                  <View style={styles.divider} />
                  {flaggedApps.map((app) => (
                    <View key={app.packageId} style={styles.threatRow}>
                      <Text style={{ color: app.riskLevel === 'risky' ? COLORS.danger : COLORS.warning, marginRight: 6 }}>
                        •
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.threatAppName, { color: textColor }]}>{app.name}</Text>
                        <Text style={[styles.threatAppPkg, { color: subTextColor }]}>{app.packageId}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Risk score card */}
            <View style={[styles.riskScoreCard, { backgroundColor: cardBg, borderColor: `${getRiskColor(riskScore.score)}33` }]}>
              <Text style={[styles.riskCardTitle, { color: subTextColor }]}>Risk Score</Text>
              
              <RiskGauge score={riskScore.score} radius={75} />

              <View style={[styles.riskLevelBadge, { backgroundColor: `${getRiskColor(riskScore.score)}1F` }]}>
                <Text style={[styles.riskLevelText, { color: getRiskColor(riskScore.score) }]}>
                  {riskScore.level === 'safe' ? 'SAFE' : riskScore.level === 'medium' ? 'MEDIUM RISK' : 'HIGH RISK'}
                </Text>
              </View>

              <Text style={[styles.riskFactorsTitle, { color: textColor }]}>Risk Factors</Text>
              
              {riskScore.reasons.map((reason, idx) => {
                const isRisk = reason !== 'No risk factors detected';
                const reasonColor = isRisk ? COLORS.danger : COLORS.safe;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.factorRow,
                      { backgroundColor: `${reasonColor}0D`, borderColor: `${reasonColor}2D` },
                    ]}
                  >
                    <Text style={{ marginRight: 10 }}>{isRisk ? '⚠️' : '✅'}</Text>
                    <Text style={[styles.factorText, { color: textColor }]}>{reason}</Text>
                  </View>
                );
              })}
            </View>

            {/* Security Checks List */}
            <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>Security Checks</Text>
            
            <StatusChip
              label="Root / Jailbreak"
              status={scanResult.isJailbroken ? 'risk' : 'safe'}
              style={{ marginBottom: 10 }}
            />
            {scanResult.isJailbroken && (
              <Text style={styles.checkDescText}>
                Device is rooted/jailbroken — system integrity compromised, banking apps are unsafe
              </Text>
            )}

            <StatusChip
              label="Developer Options"
              status={scanResult.isDeveloperModeOn ? 'warning' : 'safe'}
              style={{ marginBottom: 10 }}
            />
            {scanResult.isDeveloperModeOn && (
              <Text style={styles.checkDescTextWarning}>
                Developer mode is ON — allows USB debugging, mock locations, and app sideloading
              </Text>
            )}

            <StatusChip
              label="USB Debugging (ADB)"
              status={scanResult.isUsbDebuggingOn ? 'warning' : 'safe'}
              style={{ marginBottom: 10 }}
            />
            {scanResult.isUsbDebuggingOn && (
              <Text style={styles.checkDescTextWarning}>
                USB debugging is ON — attackers can access device data via computer connection
              </Text>
            )}

            {/* Expandable Flagged Apps Banner */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={totalThreats > 0 ? toggleExpandApps : undefined}
              style={[
                styles.suspiciousChip,
                {
                  backgroundColor: isAllClear ? 'rgba(76, 175, 80, 0.08)' : 'rgba(255, 82, 82, 0.08)',
                  borderColor: isAllClear ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 82, 82, 0.2)',
                },
              ]}
            >
              <Text style={{ fontSize: 20 }}>{isAllClear ? '✅' : '🛑'}</Text>
              <Text
                style={[
                  styles.suspiciousText,
                  { color: isAllClear ? COLORS.safe : COLORS.danger },
                ]}
              >
                {totalThreats > 0 ? `Suspicious Apps (${totalThreats} found)` : 'Suspicious Apps'}
              </Text>
              {totalThreats > 0 ? (
                <Text style={styles.expandText}>{expandedSuspiciousApps ? '▲' : '▼'}</Text>
              ) : (
                <Text style={[styles.expandText, { color: COLORS.safe }]}>Safe</Text>
              )}
            </TouchableOpacity>

            {expandedSuspiciousApps && totalThreats > 0 && (
              <View style={[styles.expandedAppsContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                <Text style={[styles.expandedAppsTitle, { color: COLORS.danger }]}>
                  ⚠️ Flagged Apps — Review these apps
                </Text>
                <Text style={[styles.expandedAppsDesc, { color: subTextColor }]}>
                  These apps may access banking data, OTPs, or record your screen. Consider uninstalling them before making transactions.
                </Text>
                {flaggedApps.map(renderAppCard)}
              </View>
            )}

            <StatusChip
              label="Permissions Risk"
              status={scanResult.hasRiskyPermissions ? 'risk' : 'safe'}
              style={{ marginBottom: 10, marginTop: 10 }}
            />
            {scanResult.hasRiskyPermissions && (
              <Text style={styles.checkDescText}>
                Device has risky permissions or is running on emulator — not safe for real transactions
              </Text>
            )}

            <StatusChip
              label="Screen Recording"
              status={scanResult.isScreenRecordingDetected ? 'risk' : 'safe'}
              style={{ marginBottom: 10 }}
            />
            {scanResult.isScreenRecordingDetected && (
              <Text style={styles.checkDescText}>
                Active screen recording detected — OTPs and PINs may be captured
              </Text>
            )}

            {/* Timings card */}
            <Text style={[styles.sectionHeader, { color: sectionTitleColor, marginTop: 24 }]}>Check Timings</Text>
            <View style={[styles.timingsCard, { backgroundColor: cardBg }]}>
              {Object.entries(scanResult.checkTimings).map(([name, val]) =>
                renderTimingRow(name, val)
              )}
            </View>

            {/* Total time summary card */}
            <View style={[styles.timingsCard, { backgroundColor: cardBg, paddingVertical: 12, marginTop: 8 }]}>
              <View style={styles.totalTimeRow}>
                <Text style={{ fontSize: 16 }}>⏱️  Total Scan Time</Text>
                <Text style={[styles.totalTimeVal, { color: COLORS.primary }]}>
                  {(totalTiming / 1000).toFixed(1)}s
                </Text>
              </View>
            </View>

            {/* Scanned Apps details */}
            <Text style={[styles.sectionHeader, { color: sectionTitleColor, marginTop: 24 }]}>
              Scanned Apps ({scanResult.scannedApps.length})
            </Text>
            
            {/* Show flagged apps first */}
            {flaggedApps.map(renderAppCard)}

            {/* Safe Apps */}
            {scanResult.scannedApps.filter((a) => a.riskLevel === 'safe').length > 0 && (
              <>
                <Text style={[styles.sectionHeader, { color: sectionTitleColor, fontSize: 14, marginTop: 14 }]}>
                  Safe Apps ({scanResult.scannedApps.filter((a) => a.riskLevel === 'safe').length})
                </Text>
                {scanResult.scannedApps.filter((a) => a.riskLevel === 'safe').map(renderAppCard)}
              </>
            )}

            <GradientButton
              text="Back to Dashboard"
              onPressed={() => navigation.navigate('Dashboard')}
              style={{ marginTop: 24 }}
            />
          </View>
        )}

        {/* Start Scan Buttons */}
        {!isScanning && !scanComplete && (
          <GradientButton
            text="Start Scan"
            onPressed={startScan}
            style={{ marginTop: 20 }}
          />
        )}

        {isScanning && (
          <Text style={[styles.waitText, { color: subTextColor }]}>Please wait...</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 60,
  },
  animSection: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  pulseCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  pulseIcon: {
    fontSize: 48,
    color: '#FFFFFF',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 16,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'System',
    marginBottom: 16,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  progressPercent: {
    fontSize: 13,
    marginTop: 8,
    fontFamily: 'System',
  },
  helperText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'System',
    marginVertical: 28,
  },
  waitText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'System',
    marginTop: 16,
  },
  resultsContainer: {
    width: '100%',
    marginTop: 10,
  },
  threatBanner: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerHeaderIcon: {
    fontSize: 24,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'System',
  },
  bannerSub: {
    fontSize: 12,
    fontFamily: 'System',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 12,
  },
  threatList: {
    width: '100%',
  },
  threatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  threatAppName: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  threatAppPkg: {
    fontSize: 10,
    fontFamily: 'System',
  },
  riskScoreCard: {
    width: '100%',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginBottom: 20,
  },
  riskCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 16,
  },
  riskLevelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
  },
  riskLevelText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'System',
  },
  riskFactorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    marginTop: 20,
    alignSelf: 'flex-start',
  },
  factorRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  factorText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'System',
    flex: 1,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 14,
    marginTop: 18,
  },
  checkDescText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    color: '#FF5252',
    fontFamily: 'System',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  checkDescTextWarning: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    color: '#FF9800',
    fontFamily: 'System',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  suspiciousChip: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  suspiciousText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
    marginLeft: 12,
  },
  expandText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  expandedAppsContainer: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.15)',
    padding: 12,
    marginTop: 10,
  },
  expandedAppsTitle: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'System',
  },
  expandedAppsDesc: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'System',
    marginVertical: 4,
  },
  appCard: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  appCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appTextContainer: {
    flex: 1,
  },
  appNameText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  appPkgText: {
    fontSize: 11,
    fontFamily: 'System',
  },
  appRiskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  appRiskBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'System',
  },
  appRiskReasonBox: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  appRiskReasonText: {
    fontSize: 12,
    fontFamily: 'System',
    flex: 1,
  },
  timingsCard: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  timingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircleIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  timingLabel: {
    fontSize: 13,
    fontFamily: 'System',
  },
  timingValue: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  totalTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  totalTimeVal: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
});
