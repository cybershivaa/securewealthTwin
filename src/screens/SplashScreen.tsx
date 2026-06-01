import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, GRADIENTS } from '../theme/appTheme';
import { useApp } from '../providers/AppProvider';

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { themeMode } = useApp();
  const isDark = themeMode === 'dark';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Scan');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim]);

  const bgGradient = isDark ? GRADIENTS.dark : GRADIENTS.light;

  return (
    <View style={styles.container}>
      <LinearGradient colors={bgGradient} style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* App Icon (Shield) */}
          <LinearGradient
            colors={GRADIENTS.primary}
            style={styles.logoContainer}
          >
            <Text style={styles.logoText}>🛡️</Text>
          </LinearGradient>

          <Text style={styles.appName}>SecurePay</Text>
          <Text style={[styles.appSubName, { color: isDark ? 'rgba(255,255,255,0.7)' : '#2D2D3A' }]}>
            Guardian
          </Text>
          
          <Text style={[styles.tagline, { color: isDark ? 'rgba(255,255,255,0.4)' : '#666677' }]}>
            Your Payment Security Shield
          </Text>

          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={styles.spinner}
          />
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  logoText: {
    fontSize: 56,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 32,
    fontFamily: 'System',
  },
  appSubName: {
    fontSize: 36,
    fontWeight: '300',
    fontFamily: 'System',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 12,
    fontFamily: 'System',
  },
  spinner: {
    marginTop: 48,
  },
});
