import React, { useState } from 'react';
import { View, Text } from 'react-native';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import { passwordStrength } from '../../utils/validators';
import { useAppDispatch } from '../../utils/hooks';
import { updateData, setStep } from '../../redux/slices/registrationSlice';
import { useNavigation } from '@react-navigation/native';
import { securitySchema } from '../../utils/validationSchemas';

export default function SecuritySetupScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mpin, setMpin] = useState('');
  const [validationError, setValidationError] = useState('');
  const dispatch = useAppDispatch();
  const nav = useNavigation();

  const onNext = async () => {
    setValidationError('');
    try {
      await securitySchema.validate({ username, password, mpin });
      dispatch(updateData({ username, password, mpin }));
      dispatch(setStep(7));
      nav.navigate('DeviceRegistration' as any);
    } catch (err: any) {
      setValidationError(err.message);
    }
  };

  const strength = passwordStrength(password);

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 12, fontWeight: 'bold' }}>Security Setup</Text>
      <InputField label="Username" value={username} onChangeText={setUsername} placeholder="Min 6 chars" />
      <InputField label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Min 8 chars with uppercase, lowercase, number, special char" />
      <Text style={{ color: strength < 3 ? 'red' : strength < 4 ? 'orange' : 'green', marginTop: 8 }}>Password strength: {strength}/5</Text>
      <InputField label="MPIN (4-6 digits)" value={mpin} onChangeText={setMpin} keyboardType="numeric" />
      {validationError ? <Text style={{ color: 'red', marginTop: 8 }}>{validationError}</Text> : null}
      <View style={{ height: 12 }} />
      <Button title="Continue" onPress={onNext} />
    </View>
  );
}
