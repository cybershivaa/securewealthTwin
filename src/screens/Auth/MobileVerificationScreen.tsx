import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { sendOtp, clearError } from '../../redux/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import { mobileSchema } from '../../utils/validationSchemas';

export default function MobileVerificationScreen() {
  const [mobile, setMobile] = useState('');
  const [validationError, setValidationError] = useState('');
  const dispatch = useAppDispatch();
  const nav = useNavigation();
  const { loading, error } = useAppSelector((s) => s.auth);

  const onSend = async () => {
    setValidationError('');
    try {
      await mobileSchema.validate({ mobile });
      const result: any = await dispatch(sendOtp(mobile));
      if (result.payload) {
        nav.navigate('OTPVerification' as any, { mobile });
      }
    } catch (err: any) {
      setValidationError(err.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 12, fontWeight: 'bold' }}>Mobile Verification</Text>
      <Text style={{ color: '#666', marginBottom: 12 }}>Enter your 10-digit mobile number</Text>
      <InputField label="Mobile Number" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" placeholder="98765 43210" />
      {validationError ? <Text style={{ color: 'red', marginTop: 8 }}>{validationError}</Text> : null}
      {error ? <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text> : null}
      <View style={{ height: 12 }} />
      <Button title={loading ? 'Sending OTP...' : 'Send OTP'} onPress={onSend} loading={loading} disabled={loading} />
    </View>
  );
}
