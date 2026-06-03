import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../assets/colors/Colors';

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  maxLength,
  error,
  success,
  helpText,
  editable = true,
  autoCapitalize = 'none',
  prefix,
  suffix,
  showToggle = false,
  multiline = false,
  style,
  inputStyle,
  onBlur,
  onFocus,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const borderColor = error
    ? Colors.borderErrorColor
    : isFocused
    ? Colors.borderFocusColor
    : Colors.borderColor;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, { borderColor }]}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, inputStyle, multiline && styles.multiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.placeholderText}
          keyboardType={keyboardType}
          secureTextEntry={isSecure}
          maxLength={maxLength}
          editable={editable}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          onFocus={() => {
            setIsFocused(true);
            onFocus && onFocus();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur && onBlur();
          }}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
        {showToggle && secureTextEntry && (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={styles.toggle}>
            <Text style={styles.toggleText}>{isSecure ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {success && !error && <Text style={styles.success}>{success}</Text>}
      {helpText && !error && !success && <Text style={styles.helpText}>{helpText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.lg,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md + 2,
    fontSize: Typography.body.fontSize,
    color: Colors.white,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  prefix: {
    fontSize: Typography.body.fontSize,
    color: Colors.lightText,
    marginRight: Spacing.md,
    fontWeight: '500',
  },
  suffix: {
    fontSize: Typography.body.fontSize,
    color: Colors.lightText,
    marginLeft: Spacing.md,
  },
  toggle: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  toggleText: {
    fontSize: 18,
  },
  error: {
    fontSize: Typography.caption.fontSize,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  success: {
    fontSize: Typography.caption.fontSize,
    color: Colors.success,
    marginTop: Spacing.xs,
  },
  helpText: {
    fontSize: Typography.caption.fontSize,
    color: Colors.mutedText,
    marginTop: Spacing.xs,
  },
});

export default InputField;
