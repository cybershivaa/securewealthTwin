import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  NativeModules,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useApp } from '../providers/AppProvider';

const { MonitorBridge } = NativeModules;

interface AlertEntry {
  title: string;
  body: string;
  tempC?: number;
  timestamp: number;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return 'Just now';
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours(); const m = d.getMinutes(); const s = d.getSeconds();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  const mm   = m.toString().padStart(2, '0');
  const ss   = s.toString().padStart(2, '0');
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${h12}:${mm}:${ss} ${ampm}`;
}

function alertIcon(title: string): string {
  if (title.includes('Critical'))  return '🚨';
  if (title.includes('Overheat') || title.includes('🔥')) return '🔥';
  if (title.includes('HIGH RISK')) return '⚠️';
  if (title.includes('Upload'))    return '⬆️';
  if (title.includes('Download'))  return '⬇️';
  return '🔔';
}

function alertSeverityColor(title: string): string {
  if (title.includes('HIGH RISK') || title.includes('Critical')) return '#FF1744';
  if (title.includes('Overheat') || title.includes('Upload'))    return '#FF6D00';
  if (title.includes('Download') || title.includes('night'))     return '#FFD600';
  return '#64B5F6';
}

export const AlertHistoryScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { themeMode } = useApp();
  const isDark = themeMode === 'dark';

  const [alerts, setAlerts]       = useState<AlertEntry[]>([]);
  const [isActive, setIsActive]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const bg    = isDark ? '#0D0D1A' : '#F0F0F5';
  const card  = isDark ? '#1A1A2E' : '#FFFFFF';
  const text  = isDark ? '#FFFFFF' : '#1A1A2E';
  const sub   = isDark ? 'rgba(255,255,255,0.5)' : '#888899';
  const bdr   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  const loadData = useCallback(async () => {
    if (Platform.OS === 'android' && MonitorBridge) {
      try {
        const [historyJson, active] = await Promise.all([
          MonitorBridge.getAlertHistory(),
          MonitorBridge.isMonitoringActive(),
        ]);
        setAlerts(JSON.parse(historyJson || '[]'));
        setIsActive(active);
      } catch {}
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleMonitor = async () => {
    if (!MonitorBridge) return;
    try {
      if (isActive) {
        await MonitorBridge.stopMonitoring();
        setIsActive(false);
      } else {
        await MonitorBridge.startMonitoring();
        setIsActive(true);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const clearHistory = () => {
    Alert.alert(
      'Clear Alert History',
      'Delete all stored alerts?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear', style: 'destructive',
          onPress: async () => {
            await MonitorBridge?.clearAlertHistory();
            setAlerts([]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: card, borderBottomColor: bdr }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: text }]}>Alert History</Text>
          <Text style={[styles.headerSub, { color: sub }]}>
            {alerts.length} alert{alerts.length !== 1 ? 's' : ''} stored
          </Text>
        </View>
        {alerts.length > 0 && (
          <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
            <Text style={styles.clearBtnTxt}>🗑 Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Monitor Toggle Card ── */}
      <LinearGradient
        colors={isActive ? ['#003300', '#001a00'] : ['#1A1A2E', '#12121F']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.toggleCard}
      >
        <View style={styles.toggleLeft}>
          <Text style={styles.toggleIcon}>{isActive ? '🛡️' : '💤'}</Text>
          <View>
            <Text style={styles.toggleTitle}>
              {isActive ? 'Background Monitor ON' : 'Background Monitor OFF'}
            </Text>
            <Text style={styles.toggleSub}>
              {isActive
                ? 'Watching temp, data & connections every 30s'
                : 'Tap to start 24/7 background monitoring'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.toggleBtn, { backgroundColor: isActive ? '#FF1744' : '#00E676' }]}
          onPress={toggleMonitor}
        >
          <Text style={[styles.toggleBtnTxt, { color: isActive ? '#fff' : '#000' }]}>
            {isActive ? 'STOP' : 'START'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Alert Rules summary ── */}
      <View style={[styles.rulesCard, { backgroundColor: card, borderColor: bdr }]}>
        <Text style={[styles.rulesTitle, { color: text }]}>🔔 Alert Triggers</Text>
        <View style={styles.rulesGrid}>
          {[
            { icon: '🌡️', label: 'Temp > 45°C',       color: '#FF6D00' },
            { icon: '🚨', label: 'Temp > 50°C',       color: '#FF1744' },
            { icon: '⬆️', label: 'Upload > 500 KB/s', color: '#FF6D00' },
            { icon: '🌙', label: 'Night upload > 100 KB/s', color: '#CE93D8' },
            { icon: '⬇️', label: 'Night download > 2 MB/s', color: '#64B5F6' },
            { icon: '⚠️', label: 'Heat + Upload spike', color: '#FF1744' },
          ].map(r => (
            <View key={r.label} style={styles.ruleItem}>
              <Text style={styles.ruleIcon}>{r.icon}</Text>
              <Text style={[styles.ruleLabel, { color: sub }]}>{r.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Alert List ── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />}
      >
        {alerts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={[styles.emptyTitle, { color: text }]}>No Alerts Yet</Text>
            <Text style={[styles.emptyBody, { color: sub }]}>
              {isActive
                ? 'Monitoring is active. Alerts will appear here when something suspicious is detected.'
                : 'Start the background monitor above to begin watching your phone 24/7.'}
            </Text>
          </View>
        ) : (
          alerts.map((alert, i) => {
            const severity = alertSeverityColor(alert.title);
            return (
              <View key={i} style={[styles.alertCard, { backgroundColor: card, borderLeftColor: severity }]}>
                <View style={styles.alertTopRow}>
                  <Text style={styles.alertIcon}>{alertIcon(alert.title)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertTitle, { color: severity }]}>{alert.title}</Text>
                    <Text style={[styles.alertTime, { color: sub }]}>
                      {formatTimestamp(alert.timestamp)} · {timeAgo(alert.timestamp)}
                    </Text>
                  </View>
                  {alert.tempC != null && alert.tempC > 0 && (
                    <View style={[styles.tempBadge, { backgroundColor: severity + '22' }]}>
                      <Text style={[styles.tempBadgeTxt, { color: severity }]}>
                        {alert.tempC.toFixed(1)}°C
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.alertBody, { color: sub }]}>{alert.body}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6,
  },
  backBtn:   { padding: 6, marginRight: 8 },
  backArrow: { fontSize: 22, color: '#6C63FF' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub:   { fontSize: 11, marginTop: 1 },
  clearBtn:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,23,68,0.12)' },
  clearBtnTxt: { fontSize: 12, fontWeight: '600', color: '#FF1744' },

  toggleCard: {
    margin: 16, borderRadius: 18, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10,
  },
  toggleLeft:   { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  toggleIcon:   { fontSize: 32 },
  toggleTitle:  { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  toggleSub:    { fontSize: 11, color: 'rgba(255,255,255,0.55)', maxWidth: 180 },
  toggleBtn:    { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  toggleBtnTxt: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

  rulesCard: {
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, padding: 14, borderWidth: 1,
  },
  rulesTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  rulesGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ruleItem:   { flexDirection: 'row', alignItems: 'center', width: '48%', gap: 4 },
  ruleIcon:   { fontSize: 14 },
  ruleLabel:  { fontSize: 11 },

  scroll: { paddingHorizontal: 16, paddingBottom: 30 },
  empty:  { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:  { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyBody:  { fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  alertCard: {
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  alertTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  alertIcon:   { fontSize: 22, marginTop: 1 },
  alertTitle:  { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  alertTime:   { fontSize: 10, marginTop: 2 },
  alertBody:   { fontSize: 12, lineHeight: 18 },
  tempBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexShrink: 0 },
  tempBadgeTxt:{ fontSize: 11, fontWeight: '700' },
});
