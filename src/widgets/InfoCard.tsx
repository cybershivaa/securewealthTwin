import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { COLORS } from '../theme/appTheme';

interface InfoCardProps {
  icon: string; // Emoji or simple icon representation
  iconColor: string;
  title: string;
  value: string;
  valueColor?: string;
  themeMode?: 'light' | 'dark';
  style?: ViewStyle;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  icon,
  iconColor,
  title,
  value,
  valueColor,
  themeMode = 'dark',
  style,
}) => {
  const isDark = themeMode === 'dark';
  const cardBg = isDark ? COLORS.darkCard : COLORS.lightCard;
  const textColor = isDark ? COLORS.darkText : COLORS.lightText;
  const titleColor = isDark ? '#888899' : '#666677';

  return (
    <View style={[styles.card, { backgroundColor: cardBg }, style]}>
      {/* Icon Container */}
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}1F` }]}>
        <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        <Text
          style={[
            styles.value,
            { color: valueColor ?? textColor },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'System',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginTop: 2,
  },
});
