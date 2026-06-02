import React, { useState } from 'react';
import { View, Text } from 'react-native';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { login } from '../../redux/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import { loginSchema } from '../../utils/validationSchemas';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const dispatch = useAppDispatch();
  const nav = useNavigation();
  const { loading, error, isAuthenticated } = useAppSelector((s) => s.auth);

  const onLogin = async () => {
    setValidationError('');
    try {
      await loginSchema.validate({ username, password });
      const result: any = await dispatch(login({ username, password }));
      if (result.payload?.data?.token) {
        // navigate to dashboard or home
        nav.navigate('Welcome' as any);
      }
    } catch (err: any) {
      setValidationError(err.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 12, fontWeight: 'bold' }}>Login</Text>
      <InputField label="Username" value={username} onChangeText={setUsername} />
      <InputField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {validationError ? <Text style={{ color: 'red', marginTop: 8 }}>{validationError}</Text> : null}
      {error ? <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text> : null}
      <View style={{ height: 12 }} />
      <Button title={loading ? 'Logging in...' : 'Login'} onPress={onLogin} loading={loading} disabled={loading} />
      <View style={{ height: 12 }} />
      <Button title="Mobile OTP Login" onPress={() => nav.navigate('MobileVerification' as any)} style={{ backgroundColor: '#6c757d' }} />
    </View>
  );
}
