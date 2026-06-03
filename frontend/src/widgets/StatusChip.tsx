import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { COLORS } from '../theme/appTheme';

export type ScanStatus = 'safe' | 'warning' | 'risk';

interface StatusChipProps {
  label: string;
  status: ScanStatus;
  style?: ViewStyle;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  label,
  status,
  style,
}) => {
  const getColors = () => {
    switch (status) {
      case 'safe':
        return {
          text: COLORS.safe,
          background: 'rgba(76, 175, 80, 0.08)',
          border: 'rgba(76, 175, 80, 0.2)',
          icon: '✅',
          statusText: 'Safe',
        };
      case 'warning':
        return {
          text: COLORS.warning,
          background: 'rgba(255, 183, 77, 0.08)',
          border: 'rgba(255, 183, 77, 0.2)',
          icon: '⚠️',
          statusText: 'Warning',
        };
      case 'risk':
        return {
          text: COLORS.danger,
          background: 'rgba(255, 82, 82, 0.08)',
          border: 'rgba(255, 82, 82, 0.2)',
          icon: '❌',
          statusText: 'Risk',
        };
    }
  };

  const current = getColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: current.background,
          borderColor: current.border,
        },
        style,
      ]}
    >
      <Text style={styles.icon}>{current.icon}</Text>
      <Text style={[styles.label, { color: current.text }]}>{label}</Text>
      <Text style={[styles.statusText, { color: current.text }]}>{current.statusText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  icon: {
    fontSize: 16,
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
