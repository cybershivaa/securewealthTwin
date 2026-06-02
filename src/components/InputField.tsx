import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';

type Props = {
  label?: string;
  value?: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
};

export default function InputField({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType }: Props) {
  return (
    <View style={s.container}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} secureTextEntry={secureTextEntry} keyboardType={keyboardType} style={s.input} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginVertical: 8 },
  label: { marginBottom: 6, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, backgroundColor: '#fff' },
});
