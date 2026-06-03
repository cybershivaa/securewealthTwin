import React from 'react';
import { View, Text } from 'react-native';
import Button from '../../components/Button';
import { useNavigation } from '@react-navigation/native';

export default function RegistrationSuccessScreen() {
  const nav = useNavigation();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, marginBottom: 12 }}>Registration Complete</Text>
      <Text style={{ color: '#666', marginBottom: 24 }}>Your account setup is complete.</Text>
      <Button title="Go To Login" onPress={() => nav.navigate('Login' as any)} />
    </View>
  );
}
