import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, GRADIENTS } from '../theme/appTheme';

interface GradientButtonProps {
  text: string;
  onPressed: (() => void) | null;
  icon?: string; // Icon name not strictly used or we can use custom emoji/char
  isLoading?: boolean;
  gradient?: readonly [string, string];
  style?: ViewStyle;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  text,
  onPressed,
  icon,
  isLoading = false,
  gradient,
  style,
}) => {
  const isDisabled = onPressed === null || isLoading;
  const buttonGradient = isDisabled
    ? ['#9E9E9E', '#757575'] as const
    : (gradient ?? GRADIENTS.primary);

  return (
    <TouchableOpacity
      onPress={isDisabled ? undefined : onPressed}
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[styles.container, style]}
    >
      <LinearGradient
        colors={buttonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.text}>
            {icon ? `${icon}  ` : ''}
            {text}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'System', // Fallback to System font
  },
});
