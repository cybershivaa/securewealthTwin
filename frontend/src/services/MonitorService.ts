import { NativeModules, Platform } from 'react-native';

const { SecurityModule } = NativeModules;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TemperatureData {
  batteryTempC: number;
  batteryTempF: number;
  batteryLevel: number;
  isCharging: boolean;
  heatLabel: 'Cool' | 'Warm' | 'Hot' | 'Critical' | 'Unknown';
}

export interface NetworkStats {
  totalRxBytes: number;
  totalTxBytes: number;
  rxPerSec: number;   // bytes/sec
  txPerSec: number;   // bytes/sec
  mobileRxBytes: number;
  mobileTxBytes: number;
  wifiRxBytes: number;
  wifiTxBytes: number;
}

export interface ActiveConnection {
  local: string;
  remote: string;
  state: string;
  isV6: boolean;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes < 0) return 'N/A';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec < 0) return 'N/A';
  return `${formatBytes(bytesPerSec)}/s`;
}

// ─── Service Calls ────────────────────────────────────────────────────────────

export const MonitorService = {
  async getTemperature(): Promise<TemperatureData> {
    if (Platform.OS === 'ios') {
      return {
        batteryTempC: -1,
        batteryTempF: -1,
        batteryLevel: -1,
        isCharging: false,
        heatLabel: 'Unknown',
      };
    }
    try {
      const raw: string = await SecurityModule.getDeviceTemperature();
      return JSON.parse(raw) as TemperatureData;
    } catch {
      return {
        batteryTempC: -1,
        batteryTempF: -1,
        batteryLevel: -1,
        isCharging: false,
        heatLabel: 'Unknown',
      };
    }
  },

  async getNetworkStats(): Promise<NetworkStats> {
    try {
      const raw: string = await SecurityModule.getNetworkStats();
      return JSON.parse(raw) as NetworkStats;
    } catch {
      return {
        totalRxBytes: 0,
        totalTxBytes: 0,
        rxPerSec: 0,
        txPerSec: 0,
        mobileRxBytes: 0,
        mobileTxBytes: 0,
        wifiRxBytes: 0,
        wifiTxBytes: 0,
      };
    }
  },

  async getActiveConnections(): Promise<ActiveConnection[]> {
    if (Platform.OS === 'ios') return [];
    try {
      const raw: string = await SecurityModule.getActiveConnections();
      return JSON.parse(raw) as ActiveConnection[];
    } catch {
      return [];
    }
  },
};
