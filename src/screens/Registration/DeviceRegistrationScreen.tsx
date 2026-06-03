import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Button from '../../components/Button';
import * as Device from 'expo-device';
import { isDeviceSafe } from '../../utils/securityUtils';

export default function DeviceRegistrationScreen() {
  const [deviceInfo, setDeviceInfo] = useState<any>({});
  const [safe, setSafe] = useState<boolean | null>(null);

  useEffect(() => {
    setDeviceInfo({ id: Device.osInternalBuildId || 'unknown', model: Device.modelName, osVersion: Device.osVersion, appVersion: '1.0.0' });
    (async () => {
      const ok = await isDeviceSafe();
      setSafe(ok);
    })();
  }, []);

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 12 }}>Device Registration</Text>
      <Text>Model: {deviceInfo.model || '—'}</Text>
      <Text>OS: {deviceInfo.osVersion || '—'}</Text>
      <Text>App: {deviceInfo.appVersion}</Text>
      <Text style={{ marginTop: 12 }}>Device Safe: {safe === null ? 'Checking...' : safe ? 'Yes' : 'No'}</Text>
      <View style={{ height: 12 }} />
      <Button title="Register Device" onPress={() => alert('Device registration not wired')} disabled={!safe} />
    </View>
  );
}
