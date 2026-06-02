import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../assets/colors/Colors';

const PasswordStrength = ({ password = '' }) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const strength = Object.values(checks).filter(Boolean).length;

  const getLabel = () => {
    if (strength === 0) return { text: '', color: Colors.mutedText };
    if (strength <= 1) return { text: 'Very Weak', color: Colors.error };
    if (strength <= 2) return { text: 'Weak', color: '#ff8c00' };
    if (strength <= 3) return { text: 'Fair', color: Colors.warning };
    if (strength <= 4) return { text: 'Strong', color: Colors.yellow };
    return { text: 'Very Strong', color: Colors.success };
  };

  const { text, color } = getLabel();

  if (!password) return null;

  return (
    <View style={styles.container}>
      <View style={styles.barsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              i <= strength ? { backgroundColor: color } : styles.barInactive,
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color }]}>{text}</Text>
      <View style={styles.rules}>
        {[
          { key: 'length', label: 'At least 8 characters' },
          { key: 'uppercase', label: 'One uppercase letter (A-Z)' },
          { key: 'lowercase', label: 'One lowercase letter (a-z)' },
          { key: 'number', label: 'One number (0-9)' },
          { key: 'special', label: 'One special character (!@#$%)' },
        ].map(({ key, label }) => (
          <View key={key} style={styles.ruleRow}>
            <Text style={[styles.ruleIcon, checks[key] && styles.rulePass]}>
              {checks[key] ? '✓' : '○'}
            </Text>
            <Text style={[styles.ruleText, checks[key] && styles.ruleTextPass]}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  barsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  barInactive: {
    backgroundColor: Colors.borderColor,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  rules: {
    gap: 4,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ruleIcon: {
    fontSize: 12,
    color: Colors.mutedText,
    width: 16,
  },
  rulePass: {
    color: Colors.success,
  },
  ruleText: {
    fontSize: 11,
    color: Colors.mutedText,
  },
  ruleTextPass: {
    color: Colors.success,
  },
});

export default PasswordStrength;
