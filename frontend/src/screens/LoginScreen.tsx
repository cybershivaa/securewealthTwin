import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, GRADIENTS } from '../theme/appTheme';
import { useApp } from '../providers/AppProvider';
import { MockApiService } from '../services/MockApiService';
import { GradientButton } from '../widgets/GradientButton';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { login: setAppLogin, themeMode } = useApp();
  const isDark = themeMode === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [obscurePassword, setObscurePassword] = useState(true);

  // Animation values
  const slideAnim = useRef(new Animated.Value(200)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    const success = await MockApiService.login(email.trim(), password);
    setIsLoading(false);

    if (success) {
      setAppLogin(email.trim());
      navigation.replace('Dashboard');
    } else {
      Alert.alert('Login Failed', 'Please check your credentials and try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const success = await MockApiService.googleSignIn();
    setIsLoading(false);

    if (success) {
      setAppLogin('user@gmail.com');
      navigation.replace('Dashboard');
    }
  };

  const bgGradient = isDark ? GRADIENTS.dark : GRADIENTS.light;
  const textColor = isDark ? COLORS.darkText : COLORS.lightText;
  const inputBg = isDark ? COLORS.darkCard : COLORS.lightCard;
  const inputBorder = isDark ? COLORS.darkBorder : COLORS.lightBorder;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={bgGradient} style={StyleSheet.absoluteFill}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Logo */}
            <LinearGradient colors={GRADIENTS.primary} style={styles.logo}>
              <Text style={styles.logoIcon}>🛡️</Text>
            </LinearGradient>

            <Text style={[styles.welcomeText, { color: textColor }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subText, { color: isDark ? 'rgba(255,255,255,0.6)' : '#666' }]}>
              Sign in to continue
            </Text>

            {/* Email Field */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    color: textColor,
                  },
                ]}
                placeholder="email@example.com"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#888'}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                      color: textColor,
                    },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#888'}
                  secureTextEntry={obscurePassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setObscurePassword(!obscurePassword)}
                  style={styles.eyeIcon}
                >
                  <Text style={styles.eyeText}>{obscurePassword ? '👁️' : '🔒'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <GradientButton
              text="Login"
              onPressed={isLoading ? null : handleLogin}
              isLoading={isLoading}
              style={styles.loginBtn}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#CCC' }]} />
              <Text style={[styles.dividerText, { color: isDark ? 'rgba(255,255,255,0.4)' : '#666' }]}>
                OR
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#CCC' }]} />
            </View>

            {/* Google Sign-in Button */}
            <TouchableOpacity
              onPress={isLoading ? undefined : handleGoogleSignIn}
              style={[
                styles.googleBtn,
                { backgroundColor: inputBg, borderColor: inputBorder },
              ]}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={[styles.googleText, { color: textColor }]}>
                Sign in with Google
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    marginBottom: 28,
  },
  logoIcon: {
    fontSize: 36,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  subText: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'System',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'System',
  },
  passwordWrapper: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  eyeText: {
    fontSize: 18,
  },
  loginBtn: {
    marginTop: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  googleBtn: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 10,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'System',
  },
});
