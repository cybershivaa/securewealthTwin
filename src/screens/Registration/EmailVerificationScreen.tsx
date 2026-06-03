import React, { useState } from 'react';
import { View, Text } from 'react-native';
import InputField from '../../components/InputField';
import Button from '../../components/Button';

export default function EmailVerificationScreen() {
  const [email, setEmail] = useState('');

  const onSend = () => {
    // validate and call API
    alert('Send email OTP (not wired)');
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 12 }}>Verify Email</Text>
      <InputField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@domain.com" />
      <View style={{ height: 12 }} />
      <Button title="Send Email OTP" onPress={onSend} />
    </View>
  );
}
