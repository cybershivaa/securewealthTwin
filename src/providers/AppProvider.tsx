import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DeviceScanResult, RiskScore, createRiskScore, getCleanScan } from '../models/types';
import { DeviceScanner } from '../services/DeviceScanner';
import { RiskEngine } from '../services/RiskEngine';

interface AppContextType {
  scanResult: DeviceScanResult | null;
  riskScore: RiskScore;
  isScanning: boolean;
  isCalculating: boolean;
  themeMode: 'light' | 'dark';
  isLoggedIn: boolean;
  userEmail: string;
  performScan: () => Promise<void>;
  calculatePaymentRisk: (amount: number, transactionTime: Date) => Promise<RiskScore>;
  toggleTheme: () => void;
  login: (email: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [scanResult, setScanResult] = useState<DeviceScanResult | null>(null);
  const [riskScore, setRiskScore] = useState<RiskScore>(createRiskScore(0, ['No scan performed yet']));
  const [isScanning, setIsScanning] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const performScan = async () => {
    setIsScanning(true);
    try {
      const result = await DeviceScanner.scanDevice();
      setScanResult(result);

      // Recalculate risk score with current scan + default payment values
      const computedRisk = RiskEngine.calculateRisk(
        result,
        0,
        new Date()
      );
      setRiskScore(computedRisk);
    } catch (e) {
      // In case of error, set a default clean scan result
      const cleanResult = DeviceScanner.getCleanScan();
      setScanResult(cleanResult);
      setRiskScore(RiskEngine.calculateRisk(cleanResult, 0, new Date()));
    } finally {
      setIsScanning(false);
    }
  };

  const calculatePaymentRisk = async (amount: number, transactionTime: Date): Promise<RiskScore> => {
    setIsCalculating(true);
    
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const computedRisk = RiskEngine.calculateRisk(
      scanResult,
      amount,
      transactionTime
    );
    
    setRiskScore(computedRisk);
    setIsCalculating(false);
    
    return computedRisk;
  };

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const login = (email: string) => {
    setIsLoggedIn(true);
    setUserEmail(email);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    setScanResult(null);
    setRiskScore(createRiskScore(0, ['No scan performed yet']));
  };

  return (
    <AppContext.Provider
      value={{
        scanResult,
        riskScore,
        isScanning,
        isCalculating,
        themeMode,
        isLoggedIn,
        userEmail,
        performScan,
        calculatePaymentRisk,
        toggleTheme,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
