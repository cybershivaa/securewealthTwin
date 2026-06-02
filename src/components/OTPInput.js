import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../assets/colors/Colors';

const OTPInput = ({ length = 6, value = '', onChange, error, autoFocus = true }) => {
  const inputs = useRef([]);
  const [otpValues, setOtpValues] = useState(Array(length).fill(''));

  useEffect(() => {
    if (value) {
      const vals = value.split('').slice(0, length);
      const padded = [...vals, ...Array(length - vals.length).fill('')];
      setOtpValues(padded);
    }
  }, [value, length]);

  const handleChange = (text, index) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newValues = [...otpValues];
    newValues[index] = digit;
    setOtpValues(newValues);
    onChange(newValues.join(''));

    // Auto-focus next
    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const newValues = [...otpValues];
      newValues[index - 1] = '';
      setOtpValues(newValues);
      onChange(newValues.join(''));
    }
  };

  return (
    <View>
      <View style={styles.container}>
        {Array(length).fill(0).map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={[
              styles.box,
              otpValues[index] ? styles.boxFilled : {},
              error ? styles.boxError : {},
            ]}
            value={otpValues[index]}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            autoFocus={autoFocus && index === 0}
            selectTextOnFocus
          />
        ))}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm + 2,
    marginVertical: Spacing.lg,
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.inputBackground,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
  },
  boxFilled: {
    borderColor: Colors.yellow,
    backgroundColor: Colors.inputFocusBackground,
  },
  boxError: {
    borderColor: Colors.error,
  },
  error: {
    fontSize: Typography.caption.fontSize,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});

export default OTPInput;
