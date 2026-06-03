import React, { useState } from 'react';
import { View, Text } from 'react-native';
import OTPInput from '../../components/OTPInput';
import Button from '../../components/Button';
import { verifyOtp, clearError } from '../../redux/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { useNavigation, useRoute } from '@react-navigation/native';
import { otpSchema } from '../../utils/validationSchemas';

export default function OTPVerificationScreen() {
  const dispatch = useAppDispatch();
  const nav = useNavigation();
  const route: any = useRoute();
  const mobile = route.params?.mobile;
  const [otp, setOtp] = useState('');
  const [validationError, setValidationError] = useState('');
  const { loading, error } = useAppSelector((s) => s.auth);

  const onVerify = async () => {
    setValidationError('');
    try {
      await otpSchema.validate({ otp });
      const result: any = await dispatch(verifyOtp({ mobile, otp }));
      if (result.payload?.data?.token) {
        nav.navigate('PersonalDetails' as any);
      }
    } catch (err: any) {
      setValidationError(err.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 12, fontWeight: 'bold' }}>OTP Verification</Text>
      <Text style={{ color: '#666', marginBottom: 12 }}>Enter OTP sent to {mobile}</Text>
      <OTPInput value={otp} onChange={setOtp} />
      {validationError ? <Text style={{ color: 'red', marginTop: 8 }}>{validationError}</Text> : null}
      {error ? <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text> : null}
      <View style={{ height: 12 }} />
      <Button title={loading ? 'Verifying...' : 'Verify OTP'} onPress={onVerify} loading={loading} disabled={loading} />
    </View>
  );
}
