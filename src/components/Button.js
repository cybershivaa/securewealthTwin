import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../assets/colors/Colors';

const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'text'
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  if (variant === 'primary') {
    return (
      <LinearGradient
        colors={[Colors.yellow, Colors.brightYellow]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.buttonGradient, disabled && styles.disabled, style]}
      >
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled || loading}
          style={styles.touchable}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.darkGreen} size="small" />
          ) : (
            <View style={styles.contentRow}>
              {icon && <Text style={styles.icon}>{icon}</Text>}
              <Text style={[styles.primaryText, textStyle]}>{title}</Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.secondary, disabled && styles.disabled, style]}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={Colors.yellow} size="small" />
        ) : (
          <View style={styles.contentRow}>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text style={[styles.secondaryText, textStyle]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.outline, disabled && styles.disabled, style]}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={Colors.yellow} size="small" />
        ) : (
          <View style={styles.contentRow}>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text style={[styles.outlineText, textStyle]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // text variant
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.textButton, style]}
      activeOpacity={0.7}
    >
      <Text style={[styles.textButtonLabel, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonGradient: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginVertical: Spacing.sm,
  },
  touchable: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  primaryText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: Colors.darkGreen,
  },
  secondary: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    marginVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  secondaryText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.yellow,
  },
  outline: {
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    marginVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.yellow,
  },
  outlineText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.yellow,
  },
  textButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  textButtonLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.yellow,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
