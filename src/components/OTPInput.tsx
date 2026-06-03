import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

type Props = { length?: number; value?: string; onChange?: (v: string) => void };

export default function OTPInput({ length = 6, value = '', onChange }: Props) {
  const inputs = Array.from({ length }).map((_, i) => value[i] || '');
  return (
    <View style={s.row}>
      {inputs.map((c, idx) => (
        <TextInput key={idx} style={s.box} value={c} editable={false} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  box: { width: 44, height: 54, borderWidth: 1, borderRadius: 8, textAlign: 'center', lineHeight: 54 },
});
