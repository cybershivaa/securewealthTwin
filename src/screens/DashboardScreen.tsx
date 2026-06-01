import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../theme/appTheme';
import { useApp } from '../providers/AppProvider';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const {
    scanResult,
    riskScore,
    themeMode,
    toggleTheme,
  } = useApp();

  const isDark = themeMode === 'dark';

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const hours24 = date.getHours();
      const minutes = date.getMinutes();
      const period = hours24 >= 12 ? 'PM' : 'AM';
      let hours12 = hours24 % 12;
      hours12 = hours12 === 0 ? 12 : hours12;
      const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
      return `${hours12}:${minutesStr} ${period}`;
    } catch (_) {
      return '';
    }
  };

  const getRiskLabel = () => {
    switch (riskScore.level) {
      case 'safe':
        return 'Safe';
      case 'medium':
        return 'Medium Risk';
      case 'high':
        return 'High Risk';
    }
  };

  const alertsCount = scanResult?.unknownAppsCount ?? 0;
  const fraudCount =
    riskScore.score > 70
      ? 3 + Math.floor(riskScore.score / 20)
      : riskScore.score > 30
      ? 1
      : 0;

  const totalApps = scanResult?.scannedApps.length ?? 0;
  const safeApps =
    scanResult?.scannedApps.filter((a) => a.riskLevel === 'safe').length ?? 0;

  const getSystemHealthText = () => {
    if (!scanResult) return 'Unknown';
    const hasIssues =
      scanResult.isDeveloperModeOn ||
      scanResult.isUsbDebuggingOn ||
      scanResult.isJailbroken ||
      scanResult.unknownAppsCount > 0 ||
      scanResult.hasRiskyPermissions ||
      scanResult.isScreenRecordingDetected;
    return hasIssues ? 'AT RISK' : 'OK';
  };

  const getSystemHealthColor = () => {
    if (!scanResult) return '#777';
    return getSystemHealthText() === 'OK' ? '#2E7D32' : '#B71C1C';
  };

  const systemStatusMessage = !scanResult
    ? 'This dashboard shows a quick overview of recent processing and detection results. Run a scan to see detailed analysis.'
    : getSystemHealthText() === 'OK'
    ? `All systems are operating normally. No threats detected. Your device passed all ${
        Object.keys(scanResult.checkTimings).length
      } security checks. Last scanned at ${formatTime(scanResult.scanTime)}.`
    : `Security risks detected on your device. ${
        scanResult.riskyApps?.length ?? 0
      } risky app(s) found. Please review the scan results and take action before proceeding with any transactions. Last scanned at ${formatTime(
        scanResult.scanTime
      )}.`;

  const dashboardBg = isDark ? '#121220' : '#F0F0F5';
  const cardBg = isDark ? '#1E1E2E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A2E';
  const subTextColor = isDark ? 'rgba(255,255,255,0.6)' : '#666677';
  const headerBg = isDark ? '#1E1E2E' : '#FFFFFF';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dashboardBg }]}>
      {/* ─── Header ────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: headerBg }]}>
        <View style={styles.bankLogoContainer}>
          <Text style={styles.bankLogoIcon}>🏦</Text>
        </View>
        <View style={styles.bankNameContainer}>
          <Text style={styles.bankName}>Punjab Sindh Bank</Text>
          <Text style={[styles.bankSub, { color: isDark ? 'rgba(255,255,255,0.5)' : '#888' }]}>
            Fraud Notifier
          </Text>
        </View>
        
        {/* Theme Toggle */}
        <TouchableOpacity onPress={toggleTheme} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>

        {/* Scan Radar Icon */}
        <TouchableOpacity onPress={() => navigation.navigate('Scan')} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>📡</Text>
        </TouchableOpacity>

        {/* Alerts Bell */}
        <TouchableOpacity onPress={() => navigation.navigate('Alerts')} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ─── Dashboard Title ────────────────────────────────── */}
        <Text style={[styles.title, { color: textColor }]}>Dashboard</Text>

        {/* ─── Risk Card ────────────────────────────── */}
        <LinearGradient
          colors={['#2E7D32', '#F9A825', '#B71C1C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.riskCard}
        >
          <View style={styles.riskTopRow}>
            <Text style={styles.riskLabel}>RISK SCORE</Text>
            <View style={styles.riskBadge}>
              <Text style={styles.riskBadgeText}>{getRiskLabel().toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.riskBottomRow}>
            <Text style={styles.riskScoreVal}>{riskScore.score} / 100</Text>
            <View style={styles.badgesWrapper}>
              {/* Alerts Badge */}
              <View style={styles.miniBadge}>
                <Text style={styles.miniBadgeLabel}>Alerts</Text>
                <Text style={styles.miniBadgeVal}>{alertsCount}</Text>
              </View>
              {/* Fraud Badge */}
              <View style={styles.miniBadge}>
                <Text style={styles.miniBadgeLabel}>Fraud</Text>
                <Text style={styles.miniBadgeVal}>{fraudCount}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ─── Stats Grid ─────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {/* Card 1 */}
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.statLabel, { color: subTextColor }]}>
              TOTAL{"\n"}APPS{"\n"}SCANNED
            </Text>
            <Text style={[styles.statValue, { color: textColor }]}>{totalApps}</Text>
          </View>
          {/* Card 2 */}
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.statLabel, { color: subTextColor }]}>
              SAFELY{"\n"}PROCESSED
            </Text>
            <Text style={[styles.statValue, { color: textColor }]}>{safeApps}</Text>
          </View>
          {/* Card 3 */}
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.statLabel, { color: subTextColor }]}>
              SYSTEM{"\n"}HEALTH
            </Text>
            <Text style={[styles.statValue, { color: getSystemHealthColor() }]}>
              {getSystemHealthText()}
            </Text>
          </View>
        </View>

        {/* ─── System Status ──────────────────────────────────── */}
        <View style={[styles.statusBox, { backgroundColor: cardBg }]}>
          <Text style={[styles.statusBoxTitle, { color: textColor }]}>System Status</Text>
          <Text style={[styles.statusBoxText, { color: subTextColor }]}>
            {systemStatusMessage}
          </Text>

          {scanResult?.isScreenRecordingDetected && (
            <View style={styles.warningAlert}>
              <Text style={styles.warningAlertIcon}>⚠️</Text>
              <Text style={styles.warningAlertText}>
                Screen recording detected — OTP exposure risk!
              </Text>
            </View>
          )}
        </View>

        {/* ─── Action Buttons ─────────────────────────────────── */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: COLORS.primary }]}
            onPress={() => navigation.navigate('Scan')}
          >
            <Text style={styles.actionBtnIcon}>📡</Text>
            <Text style={styles.actionBtnText}>Scan Device</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: COLORS.secondary }]}
            onPress={() => navigation.navigate('Payment')}
          >
            <Text style={styles.actionBtnIcon}>💳</Text>
            <Text style={styles.actionBtnText}>Simulate Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: '#4A41D7' }]}
            onPress={() => navigation.navigate('Monitor')}
          >
            <Text style={styles.actionBtnIcon}>📊</Text>
            <Text style={styles.actionBtnText}>Live Monitor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: '#B71C1C' }]}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Text style={styles.actionBtnIcon}>🔔</Text>
            <Text style={styles.actionBtnText}>Alert History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  bankLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1B5E20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankLogoIcon: {
    fontSize: 24,
  },
  bankNameContainer: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#CC3300',
    fontFamily: 'System',
  },
  bankSub: {
    fontSize: 12,
    fontFamily: 'System',
  },
  headerBtn: {
    padding: 8,
    marginLeft: 10,
  },
  headerBtnText: {
    fontSize: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginBottom: 12,
  },
  riskCard: {
    width: '100%',
    padding: 20,
    borderRadius: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    marginBottom: 20,
  },
  riskTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.2,
    fontFamily: 'System',
  },
  riskBadge: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  riskBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  riskScoreVal: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  badgesWrapper: {
    flexDirection: 'row',
  },
  miniBadge: {
    backgroundColor: 'rgba(0,0,0,0.26)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  miniBadgeLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'System',
  },
  miniBadgeVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'System',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    lineHeight: 14,
    fontFamily: 'System',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginTop: 8,
  },
  statusBox: {
    width: '100%',
    padding: 18,
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginBottom: 20,
  },
  statusBoxTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: 8,
  },
  statusBoxText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'System',
  },
  warningAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
    marginTop: 12,
  },
  warningAlertIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  warningAlertText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF5252',
    fontFamily: 'System',
    flex: 1,
  },
  btnRow: {
    width: '100%',
  },
  primaryActionBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionBtnIcon: {
    fontSize: 18,
    marginRight: 8,
    color: '#FFF',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'System',
  },
});
