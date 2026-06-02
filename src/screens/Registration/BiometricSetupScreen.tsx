import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Button from '../../components/Button';
import { isBiometricSupported, authenticate } from '../../utils/biometrics';

export default function BiometricSetupScreen() {
  const [supported, setSupported] = useState<boolean | null>(null);

  (async () => {
    if (supported === null) setSupported(await isBiometricSupported());
  })();

  const onEnable = async () => {
    const res = await authenticate();
    if (res) alert('Biometric enabled (mock)');
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 12 }}>Biometric Setup</Text>
      <Text>Supported: {supported === null ? 'Checking...' : supported ? 'Yes' : 'No'}</Text>
      <View style={{ height: 12 }} />
      <Button title="Enable Biometric" onPress={onEnable} disabled={!supported} />
      <View style={{ height: 12 }} />
      <Button title="Enable Later" onPress={() => alert('You can enable later')} style={{ backgroundColor: '#6c757d' }} />
    </View>
  );
}
