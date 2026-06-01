import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useApp } from '../providers/AppProvider';
import {
  MonitorService,
  TemperatureData,
  NetworkStats,
  ActiveConnection,
  formatBytes,
  formatSpeed,
} from '../services/MonitorService';

const POLL_INTERVAL_MS = 1500;
const SPARKLINE_POINTS = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function heatColor(label: string) {
  switch (label) {
    case 'Cool': return '#00E676';
    case 'Warm': return '#FFD600';
    case 'Hot':  return '#FF6D00';
    case 'Critical': return '#FF1744';
    default: return '#90A4AE';
  }
}

function stateColor(state: string) {
  switch (state) {
    case 'ESTABLISHED': return '#00E676';
    case 'LISTEN':      return '#64B5F6';
    case 'TIME_WAIT':
    case 'CLOSE_WAIT':  return '#FFD600';
    case 'CLOSE':       return '#90A4AE';
    default:            return '#CE93D8';
  }
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

const Sparkline: React.FC<{
  data: number[];
  color: string;
  height?: number;
  width?: number;
}> = ({ data, color, height = 40, width = 160 }) => {
  if (data.length < 2) return <View style={{ height, width }} />;
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  });

  // Rendered as a sequence of tiny bars for React Native (no SVG dep needed)
  const barWidth = width / data.length - 1;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, width }}>
      {data.map((v, i) => {
        const barH = Math.max(2, (v / max) * height);
        return (
          <View
            key={i}
            style={{
              width: barWidth,
              height: barH,
              backgroundColor: color,
              opacity: 0.7 + 0.3 * (i / data.length),
              marginRight: 1,
              borderRadius: 1,
            }}
          />
        );
      })}
    </View>
  );
};

// ─── Temperature Arc Gauge ────────────────────────────────────────────────────

const TempGauge: React.FC<{ tempC: number; label: string }> = ({ tempC, label }) => {
  const pct = clamp((tempC / 60) * 100, 0, 100);
  const color = heatColor(label);
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: pct,
      duration: 800,
      useNativeDriver: false,
      easing: Easing.out(Easing.quad),
    }).start();
  }, [pct]);

  const barWidth = animVal.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.tempGaugeWrap}>
      <Text style={[styles.tempBigNum, { color }]}>
        {tempC >= 0 ? `${tempC.toFixed(1)}°C` : '—'}
      </Text>
      <View style={styles.tempBarBg}>
        <Animated.View
          style={[styles.tempBarFill, { width: barWidth, backgroundColor: color }]}
        />
      </View>
      <View style={styles.tempBarLabels}>
        <Text style={styles.tempBarLabel}>0°C</Text>
        <Text style={styles.tempBarLabel}>30°C</Text>
        <Text style={styles.tempBarLabel}>60°C</Text>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const MonitorScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { themeMode } = useApp();
  const isDark = themeMode === 'dark';

  // State
  const [temp, setTemp] = useState<TemperatureData | null>(null);
  const [netStats, setNetStats] = useState<NetworkStats | null>(null);
  const [connections, setConnections] = useState<ActiveConnection[]>([]);
  const [rxHistory, setRxHistory] = useState<number[]>(Array(SPARKLINE_POINTS).fill(0));
  const [txHistory, setTxHistory] = useState<number[]>(Array(SPARKLINE_POINTS).fill(0));
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  // Pulse animation for the LIVE dot
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
      ])
    );
    if (isLive) pulse.start();
    else pulse.stop();
    return () => pulse.stop();
  }, [isLive]);

  const fetchAll = useCallback(async () => {
    const [t, n, c] = await Promise.all([
      MonitorService.getTemperature(),
      MonitorService.getNetworkStats(),
      MonitorService.getActiveConnections(),
    ]);

    setTemp(t);
    setNetStats(n);
    setConnections(c);

    setRxHistory(prev => [...prev.slice(1), n.rxPerSec]);
    setTxHistory(prev => [...prev.slice(1), n.txPerSec]);

    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    setLastUpdated(`${h12}:${m}:${s} ${ampm}`);
  }, []);

  useEffect(() => {
    fetchAll();
    if (!isLive) return;
    const interval = setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isLive, fetchAll]);

  // ── Theme colours ──
  const bg     = isDark ? '#0D0D1A' : '#F0F0F5';
  const card   = isDark ? '#1A1A2E' : '#FFFFFF';
  const text   = isDark ? '#FFFFFF' : '#1A1A2E';
  const sub    = isDark ? 'rgba(255,255,255,0.5)' : '#888899';
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // ── Established connections only for list ──
  const established = connections.filter(c => c.state === 'ESTABLISHED' && c.remote !== '0.0.0.0:0');
  const listening    = connections.filter(c => c.state === 'LISTEN');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: text }]}>Live Monitor</Text>
          <Text style={[styles.headerSub, { color: sub }]}>Updated: {lastUpdated || '—'}</Text>
        </View>
        {/* LIVE / PAUSE toggle */}
        <TouchableOpacity
          style={[styles.liveBtn, { backgroundColor: isLive ? 'rgba(0,230,118,0.15)' : 'rgba(150,150,150,0.15)' }]}
          onPress={() => setIsLive(v => !v)}
        >
          <Animated.View style={[styles.liveDot, { opacity: pulseAnim, backgroundColor: isLive ? '#00E676' : '#777' }]} />
          <Text style={[styles.liveTxt, { color: isLive ? '#00E676' : '#777' }]}>
            {isLive ? 'LIVE' : 'PAUSED'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ═══════════════════════════════════════════════════
            CARD 1 — TEMPERATURE
        ═══════════════════════════════════════════════════ */}
        <LinearGradient
          colors={
            temp?.heatLabel === 'Cool'     ? ['#004D40', '#00251A'] :
            temp?.heatLabel === 'Warm'     ? ['#4A2800', '#1A0D00'] :
            temp?.heatLabel === 'Hot'      ? ['#5D1A00', '#2D0800'] :
            temp?.heatLabel === 'Critical' ? ['#7F0000', '#3D0000'] :
            ['#1A1A2E', '#12121F']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bigCard}
        >
          {/* Header row */}
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardIcon}>🌡️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Phone Temperature</Text>
              <Text style={[styles.cardSub, { color: 'rgba(255,255,255,0.55)' }]}>Battery sensor · Real-time</Text>
            </View>
            <View style={[styles.heatBadge, { backgroundColor: heatColor(temp?.heatLabel ?? 'Unknown') + '28' }]}>
              <Text style={[styles.heatBadgeTxt, { color: heatColor(temp?.heatLabel ?? 'Unknown') }]}>
                {temp?.heatLabel ?? '—'}
              </Text>
            </View>
          </View>

          {/* Gauge */}
          <TempGauge tempC={temp?.batteryTempC ?? -1} label={temp?.heatLabel ?? 'Unknown'} />

          {/* Sub stats row */}
          <View style={styles.tempSubRow}>
            <View style={styles.tempSubCell}>
              <Text style={styles.tempSubLabel}>FAHRENHEIT</Text>
              <Text style={styles.tempSubVal}>
                {temp && temp.batteryTempF >= 0 ? `${temp.batteryTempF.toFixed(1)}°F` : '—'}
              </Text>
            </View>
            <View style={styles.tempSubCell}>
              <Text style={styles.tempSubLabel}>BATTERY</Text>
              <Text style={styles.tempSubVal}>
                {temp && temp.batteryLevel >= 0 ? `${temp.batteryLevel}%` : '—'}
              </Text>
            </View>
            <View style={styles.tempSubCell}>
              <Text style={styles.tempSubLabel}>STATUS</Text>
              <Text style={[styles.tempSubVal, { color: temp?.isCharging ? '#00E676' : '#90A4AE' }]}>
                {temp ? (temp.isCharging ? '⚡ Charging' : '🔋 On Battery') : '—'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ═══════════════════════════════════════════════════
            CARD 2 — NETWORK SPEED
        ═══════════════════════════════════════════════════ */}
        <View style={[styles.bigCard, { backgroundColor: card }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardIcon}>📡</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: text }]}>Network Traffic</Text>
              <Text style={[styles.cardSub, { color: sub }]}>Live speed · Per second</Text>
            </View>
          </View>

          {/* Speed Row */}
          <View style={styles.speedRow}>
            {/* Download */}
            <View style={styles.speedCell}>
              <Text style={styles.speedArrow}>↓</Text>
              <Text style={[styles.speedVal, { color: '#00B0FF' }]}>
                {netStats ? formatSpeed(netStats.rxPerSec) : '—'}
              </Text>
              <Text style={[styles.speedLabel, { color: sub }]}>Download</Text>
              <Sparkline data={rxHistory} color="#00B0FF" />
            </View>

            <View style={[styles.speedDivider, { backgroundColor: border }]} />

            {/* Upload */}
            <View style={styles.speedCell}>
              <Text style={styles.speedArrow}>↑</Text>
              <Text style={[styles.speedVal, { color: '#FF6D00' }]}>
                {netStats ? formatSpeed(netStats.txPerSec) : '—'}
              </Text>
              <Text style={[styles.speedLabel, { color: sub }]}>Upload</Text>
              <Sparkline data={txHistory} color="#FF6D00" />
            </View>
          </View>

          {/* Data Usage breakdown */}
          <View style={[styles.usageRow, { borderTopColor: border }]}>
            {[
              { icon: '📶', label: 'Mobile RX', val: netStats?.mobileRxBytes ?? -1, color: '#CE93D8' },
              { icon: '📶', label: 'Mobile TX', val: netStats?.mobileTxBytes ?? -1, color: '#CE93D8' },
              { icon: '📶', label: 'Wi-Fi RX',  val: netStats?.wifiRxBytes ?? -1,   color: '#80DEEA' },
              { icon: '📶', label: 'Wi-Fi TX',  val: netStats?.wifiTxBytes ?? -1,   color: '#80DEEA' },
            ].map(item => (
              <View key={item.label} style={styles.usageCell}>
                <Text style={[styles.usageLabel, { color: sub }]}>{item.label}</Text>
                <Text style={[styles.usageVal, { color: item.color }]}>
                  {item.val >= 0 ? formatBytes(item.val) : 'N/A'}
                </Text>
              </View>
            ))}
          </View>

          {/* Total since boot */}
          <View style={[styles.totalRow, { borderTopColor: border }]}>
            <View style={styles.totalCell}>
              <Text style={[styles.totalLabel, { color: sub }]}>TOTAL RECEIVED (since boot)</Text>
              <Text style={[styles.totalVal, { color: '#00B0FF' }]}>
                {netStats && netStats.totalRxBytes >= 0 ? formatBytes(netStats.totalRxBytes) : 'N/A'}
              </Text>
            </View>
            <View style={styles.totalCell}>
              <Text style={[styles.totalLabel, { color: sub }]}>TOTAL SENT (since boot)</Text>
              <Text style={[styles.totalVal, { color: '#FF6D00' }]}>
                {netStats && netStats.totalTxBytes >= 0 ? formatBytes(netStats.totalTxBytes) : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════
            CARD 3 — ACTIVE CONNECTIONS
        ═══════════════════════════════════════════════════ */}
        <View style={[styles.bigCard, { backgroundColor: card, marginBottom: 30 }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardIcon}>🔗</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: text }]}>Active Connections</Text>
              <Text style={[styles.cardSub, { color: sub }]}>
                {Platform.OS === 'android'
                  ? `${established.length} established · ${listening.length} listening`
                  : 'Not available on iOS'}
              </Text>
            </View>
            <View style={[styles.connCountBadge, { backgroundColor: established.length > 0 ? 'rgba(0,230,118,0.15)' : 'rgba(100,100,100,0.15)' }]}>
              <Text style={[styles.connCountTxt, { color: established.length > 0 ? '#00E676' : '#777' }]}>
                {established.length}
              </Text>
            </View>
          </View>

          {Platform.OS === 'ios' ? (
            <Text style={[styles.unavailableTxt, { color: sub }]}>
              /proc/net/tcp is sandboxed on iOS.
            </Text>
          ) : established.length === 0 ? (
            <View style={styles.emptyConns}>
              <Text style={styles.emptyIcon}>🔒</Text>
              <Text style={[styles.emptyTxt, { color: sub }]}>No active outbound connections</Text>
            </View>
          ) : (
            established.slice(0, 20).map((conn, i) => (
              <View key={i} style={[styles.connRow, { borderBottomColor: border }]}>
                <View style={[styles.connStateDot, { backgroundColor: stateColor(conn.state) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.connRemote, { color: text }]}>{conn.remote}</Text>
                  <Text style={[styles.connLocal, { color: sub }]}>local: {conn.local}</Text>
                </View>
                <Text style={[styles.connState, { color: stateColor(conn.state) }]}>{conn.state}</Text>
              </View>
            ))
          )}

          {/* LISTEN ports section */}
          {listening.length > 0 && (
            <View style={[styles.listenSection, { borderTopColor: border }]}>
              <Text style={[styles.listenTitle, { color: sub }]}>
                🔊 Listening Ports ({listening.length})
              </Text>
              <View style={styles.listenPorts}>
                {listening.slice(0, 12).map((c, i) => {
                  const port = c.local.split(':').pop() ?? c.local;
                  return (
                    <View key={i} style={[styles.portBadge, { backgroundColor: 'rgba(100,181,246,0.15)' }]}>
                      <Text style={styles.portBadgeTxt}>{port}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  backBtn: { padding: 6, marginRight: 8 },
  backArrow: { fontSize: 22, color: '#6C63FF' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 11, marginTop: 1 },
  liveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },

  scroll: { padding: 16 },

  // Big card container
  bigCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },

  // Card header
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  cardIcon: { fontSize: 28 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  cardSub: { fontSize: 11, marginTop: 2 },

  // Temperature
  heatBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  heatBadgeTxt: { fontSize: 12, fontWeight: '700' },
  tempGaugeWrap: { marginBottom: 16 },
  tempBigNum: { fontSize: 42, fontWeight: '800', letterSpacing: -1, marginBottom: 12 },
  tempBarBg: { height: 10, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 5, overflow: 'hidden' },
  tempBarFill: { height: 10, borderRadius: 5 },
  tempBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  tempBarLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  tempSubRow: { flexDirection: 'row', justifyContent: 'space-between' },
  tempSubCell: { alignItems: 'center', flex: 1 },
  tempSubLabel: { fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.6, marginBottom: 4 },
  tempSubVal: { fontSize: 13, fontWeight: '600', color: '#FFF' },

  // Network speed
  speedRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  speedCell: { flex: 1, alignItems: 'center' },
  speedArrow: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  speedVal: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  speedLabel: { fontSize: 10, marginBottom: 8, letterSpacing: 0.4 },
  speedDivider: { width: 1, height: 100, marginHorizontal: 8, alignSelf: 'center' },

  // Data usage grid
  usageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    paddingTop: 14,
    marginBottom: 14,
  },
  usageCell: { width: '50%', paddingVertical: 4, paddingHorizontal: 4 },
  usageLabel: { fontSize: 10, letterSpacing: 0.4 },
  usageVal: { fontSize: 14, fontWeight: '700', marginTop: 2 },

  // Total row
  totalRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 14, gap: 12 },
  totalCell: { flex: 1 },
  totalLabel: { fontSize: 9, letterSpacing: 0.5, marginBottom: 4 },
  totalVal: { fontSize: 16, fontWeight: '800' },

  // Connections
  connCountBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  connCountTxt: { fontSize: 16, fontWeight: '800' },
  connRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  connStateDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  connRemote: { fontSize: 13, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  connLocal: { fontSize: 10, marginTop: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  connState: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  emptyConns: { alignItems: 'center', paddingVertical: 24 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyTxt: { fontSize: 13 },
  unavailableTxt: { textAlign: 'center', paddingVertical: 20, fontSize: 13 },

  // Listen ports
  listenSection: { borderTopWidth: 1, paddingTop: 14, marginTop: 4 },
  listenTitle: { fontSize: 11, fontWeight: '600', marginBottom: 10, letterSpacing: 0.4 },
  listenPorts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  portBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  portBadgeTxt: { fontSize: 12, color: '#64B5F6', fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
