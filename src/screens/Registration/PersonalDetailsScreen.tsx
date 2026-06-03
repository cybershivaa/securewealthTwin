import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import { useAppDispatch } from '../../utils/hooks';
import { updateData, setStep } from '../../redux/slices/registrationSlice';
import { useNavigation } from '@react-navigation/native';
import { personalDetailsSchema } from '../../utils/validationSchemas';

export default function PersonalDetailsScreen() {
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [pan, setPan] = useState('');
  const [validationError, setValidationError] = useState('');
  const dispatch = useAppDispatch();
  const nav = useNavigation();

  const onNext = async () => {
    setValidationError('');
    try {
      await personalDetailsSchema.validate({ fullName, dob, gender, pan });
      dispatch(updateData({ fullName, dob, gender, pan }));
      dispatch(setStep(5));
      nav.navigate('BankLinking' as any);
    } catch (err: any) {
      setValidationError(err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 12, fontWeight: 'bold' }}>Personal Details</Text>
      <InputField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="John Doe" />
      <InputField label="Date of Birth" value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" />
      <InputField label="Gender" value={gender} onChangeText={setGender} placeholder="M/F/Other" />
      <InputField label="PAN Number" value={pan} onChangeText={setPan} placeholder="ABCDE1234F" />
      {validationError ? <Text style={{ color: 'red', marginTop: 8 }}>{validationError}</Text> : null}
      <View style={{ height: 12 }} />
      <Button title="Continue" onPress={onNext} />
    </ScrollView>
  );
}
