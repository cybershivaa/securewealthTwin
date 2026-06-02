import React, { useState } from 'react';
import { View, Text } from 'react-native';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import { useAppDispatch } from '../../utils/hooks';
import { updateData, setStep } from '../../redux/slices/registrationSlice';
import { useNavigation } from '@react-navigation/native';
import { bankDetailsSchema } from '../../utils/validationSchemas';

export default function BankLinkingScreen() {
  const [accountNumber, setAccountNumber] = useState('');
  const [cif, setCif] = useState('');
  const [cardLast6, setCardLast6] = useState('');
  const [validationError, setValidationError] = useState('');
  const dispatch = useAppDispatch();
  const nav = useNavigation();

  const onVerify = async () => {
    setValidationError('');
    try {
      await bankDetailsSchema.validate({ accountNumber, cif, cardLast6 });
      dispatch(updateData({ accountNumber, cif, cardLast6 }));
      dispatch(setStep(6));
      nav.navigate('SecuritySetup' as any);
    } catch (err: any) {
      setValidationError(err.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 12, fontWeight: 'bold' }}>Link Bank Account</Text>
      <InputField label="Account Number" value={accountNumber} onChangeText={setAccountNumber} keyboardType="numeric" />
      <InputField label="CIF Number" value={cif} onChangeText={setCif} />
      <InputField label="Debit Card Last 6" value={cardLast6} onChangeText={setCardLast6} keyboardType="numeric" />
      {validationError ? <Text style={{ color: 'red', marginTop: 8 }}>{validationError}</Text> : null}
      <View style={{ height: 12 }} />
      <Button title="Verify Account" onPress={onVerify} />
    </View>
  );
}
