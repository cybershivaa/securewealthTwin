import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Button from '../../components/Button';
import { useNavigation } from '@react-navigation/native';

export default function WelcomeScreen() {
  const nav = useNavigation();
  return (
    <View style={s.container}>
      <Image source={require('../../../psb-logo.svg')} style={s.logo} />
      <Text style={s.tag}>Secure banking for everyone</Text>
      <View style={{ width: '100%', paddingHorizontal: 24 }}>
        <Button title="Register" onPress={() => nav.navigate('MobileVerification' as any)} />
        <View style={{ height: 12 }} />
        <Button title="Login" onPress={() => nav.navigate('Login' as any)} style={{ backgroundColor: '#6c757d' }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f8fb' },
  logo: { width: 140, height: 140, marginBottom: 18 },
  tag: { fontSize: 16, marginBottom: 24, color: '#333' },
});
