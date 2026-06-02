import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SecureApiClient, persistAccessToken } from '../api/secureApi';
import { SecureSessionManager } from '../encryption/session';
import { isBiometricAvailable, promptBiometricUnlock } from '../security/biometric';
import { FraudService } from '../services/fraudService';
import { loadSecureSession } from '../secure-storage/keychain';

const baseURL = 'https://securewealth.pnb.example';
const deviceId = 'securewealth-device-001';

const apiClient = new SecureApiClient(baseURL);
const sessionManager = new SecureSessionManager(baseURL, deviceId);
const fraudService = new FraudService(apiClient);

export default function CryptoDemoScreen() {
  const [status, setStatus] = useState('Idle');
  const [biometricReady, setBiometricReady] = useState(false);

  useEffect(() => {
    void (async () => {
      setBiometricReady(await isBiometricAvailable());
    })();
  }, []);

  const bootstrapSecureSession = async () => {
    setStatus('Bootstrapping secure session');
    const existing = await loadSecureSession();
    if (!existing) {
      await sessionManager.establishSession();
    }
    setStatus('Secure session ready');
  };

  const unlockAndIssueToken = async () => {
    if (!biometricReady) {
      setStatus('Biometrics unavailable');
      return;
    }

    const unlocked = await promptBiometricUnlock();
    if (!unlocked) {
      setStatus('Biometric unlock rejected');
      return;
    }

    const session = await sessionManager.getActiveSession();
    if (!session) {
      await sessionManager.establishSession();
    }

    const tokenResponse = await fraudService.issueAccessToken({
      user_id: 'demo-user',
      device_id: deviceId,
      session_id: (await sessionManager.getActiveSession())!.sessionId,
    });
    await persistAccessToken(tokenResponse.access_token);
    setStatus('Secure token stored in Keychain');
  };

  const sendFraudSample = async () => {
    const session = await sessionManager.getActiveSession();
    if (!session) {
      await sessionManager.establishSession();
    }

    const result = await fraudService.submitFraudPayload({
      user_id: 'demo-user',
      device_id: deviceId,
      session_id: (await sessionManager.getActiveSession())!.sessionId,
      risk_score: 92,
      sms_text: 'Your account will be blocked unless you verify immediately with this link.',
    });
    setStatus(`Encrypted payload stored: ${result.request_id}`);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Punjab National Bank</Text>
          <Text style={styles.title}>SecureWealth Twin</Text>
          <Text style={styles.subtitle}>Zero-trust fraud intelligence with post-quantum secure transport, signed envelopes, and encrypted local storage.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Security State</Text>
          <Text style={styles.status}>{status}</Text>
          <Text style={styles.meta}>Biometrics: {biometricReady ? 'Available' : 'Unavailable'}</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={bootstrapSecureSession}>
          <Text style={styles.buttonText}>Bootstrap Secure Session</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={unlockAndIssueToken}>
          <Text style={styles.buttonText}>Unlock and Issue Token</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={sendFraudSample}>
          <Text style={styles.buttonText}>Send Encrypted Fraud Sample</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07111f',
  },
  container: {
    padding: 20,
    gap: 16,
  },
  hero: {
    paddingVertical: 24,
  },
  kicker: {
    color: '#8ab4ff',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 12,
    marginBottom: 8,
  },
  title: {
    color: '#f8fbff',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: '#b6c3d7',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#0f1d33',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#18304d',
  },
  cardTitle: {
    color: '#f8fbff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  status: {
    color: '#d8e6ff',
    fontSize: 14,
    marginBottom: 8,
  },
  meta: {
    color: '#8ea3c1',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: '#2c68ff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#13253d',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#203a61',
  },
  buttonText: {
    color: '#f8fbff',
    fontSize: 15,
    fontWeight: '700',
  },
});
