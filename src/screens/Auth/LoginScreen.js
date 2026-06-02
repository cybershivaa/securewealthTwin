import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { Colors, Typography, Spacing, BorderRadius } from '../../assets/colors/Colors';
import { loginWithCredentials } from '../../redux/actions/authActions';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [loginMethod, setLoginMethod] = useState('credentials'); // 'credentials', 'otp', 'mpin', 'biometric'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [mpin, setMpin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginWithCredentials = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setIsLoading(true);
    try {
      await dispatch(loginWithCredentials(username, password));
      // Navigate to dashboard on success
      // navigation.navigate('Dashboard');
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Unable to login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithOTP = async () => {
    if (!mobileNumber.trim() || !otp.trim()) {
      Alert.alert('Error', 'Please enter mobile number and OTP');
      return;
    }
    setIsLoading(true);
    try {
      // await dispatch(loginWithOTP(mobileNumber, otp));
      Alert.alert('Success', 'Login successful!');
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Unable to login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithMPIN = async () => {
    if (!mobileNumber.trim() || !mpin.trim()) {
      Alert.alert('Error', 'Please enter mobile number and MPIN');
      return;
    }
    setIsLoading(true);
    try {
      Alert.alert('Success', 'MPIN login successful!');
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Unable to login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithBiometric = async () => {
    setIsLoading(true);
    try {
      Alert.alert('Success', 'Biometric login successful!');
    } catch (error) {
      Alert.alert('Error', 'Biometric login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Login</Text>
        </View>

        {/* Login Methods Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, loginMethod === 'credentials' && styles.tabActive]}
            onPress={() => setLoginMethod('credentials')}
          >
            <Text
              style={[
                styles.tabText,
                loginMethod === 'credentials' && styles.tabTextActive,
              ]}
            >
              Credentials
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, loginMethod === 'otp' && styles.tabActive]}
            onPress={() => setLoginMethod('otp')}
          >
            <Text
              style={[styles.tabText, loginMethod === 'otp' && styles.tabTextActive]}
            >
              OTP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, loginMethod === 'mpin' && styles.tabActive]}
            onPress={() => setLoginMethod('mpin')}
          >
            <Text
              style={[
                styles.tabText,
                loginMethod === 'mpin' && styles.tabTextActive,
              ]}
            >
              MPIN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, loginMethod === 'biometric' && styles.tabActive]}
            onPress={() => setLoginMethod('biometric')}
          >
            <Text
              style={[
                styles.tabText,
                loginMethod === 'biometric' && styles.tabTextActive,
              ]}
            >
              Biometric
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Form Content */}
        <View style={styles.formContainer}>
          {/* Credentials Login */}
          {loginMethod === 'credentials' && (
            <>
              <Text style={styles.formLabel}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor={Colors.placeholderText}
                value={username}
                onChangeText={setUsername}
                editable={!isLoading}
              />

              <Text style={styles.formLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.placeholderText}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </>
          )}

          {/* OTP Login */}
          {loginMethod === 'otp' && (
            <>
              <Text style={styles.formLabel}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your mobile number"
                placeholderTextColor={Colors.placeholderText}
                keyboardType="phone-pad"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                editable={!isLoading}
              />

              <Text style={styles.formLabel}>OTP</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor={Colors.placeholderText}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                editable={!isLoading}
              />

              <TouchableOpacity>
                <Text style={styles.forgotPassword}>Resend OTP</Text>
              </TouchableOpacity>
            </>
          )}

          {/* MPIN Login */}
          {loginMethod === 'mpin' && (
            <>
              <Text style={styles.formLabel}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your mobile number"
                placeholderTextColor={Colors.placeholderText}
                keyboardType="phone-pad"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                editable={!isLoading}
              />

              <Text style={styles.formLabel}>MPIN</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your 4-6 digit MPIN"
                placeholderTextColor={Colors.placeholderText}
                keyboardType="number-pad"
                secureTextEntry
                value={mpin}
                onChangeText={setMpin}
                editable={!isLoading}
              />
            </>
          )}

          {/* Biometric Login */}
          {loginMethod === 'biometric' && (
            <View style={styles.biometricContainer}>
              <View style={styles.biometricIcon}>
                <Text style={styles.biometricEmoji}>🔐</Text>
              </View>
              <Text style={styles.biometricTitle}>Biometric Authentication</Text>
              <Text style={styles.biometricDescription}>
                Use your fingerprint or face to login securely
              </Text>
            </View>
          )}
        </View>

        {/* Login Button */}
        <View style={styles.bottomSection}>
          <LinearGradient
            colors={[Colors.yellow, Colors.brightYellow]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.loginButton}
          >
            <TouchableOpacity
              onPress={() => {
                if (loginMethod === 'credentials') handleLoginWithCredentials();
                else if (loginMethod === 'otp') handleLoginWithOTP();
                else if (loginMethod === 'mpin') handleLoginWithMPIN();
                else if (loginMethod === 'biometric') handleLoginWithBiometric();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.darkGreen} size="large" />
              ) : (
                <Text style={styles.loginButtonText}>Login →</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>New to PSB Digital? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
              <Text style={styles.signUpLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.yellow,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.h1.fontSize,
    fontWeight: '700',
    color: Colors.white,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.yellow,
  },
  tabText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    color: Colors.lightText,
  },
  tabTextActive: {
    color: Colors.darkGreen,
  },
  formContainer: {
    marginBottom: Spacing.xxxl,
  },
  formLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.body.fontSize,
    color: Colors.white,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginBottom: Spacing.lg,
    paddingRight: Spacing.md,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.body.fontSize,
    color: Colors.white,
  },
  eyeIcon: {
    fontSize: 18,
  },
  forgotPassword: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.yellow,
    fontWeight: '600',
  },
  biometricContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  biometricIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  biometricEmoji: {
    fontSize: 40,
  },
  biometricTitle: {
    fontSize: Typography.h3.fontSize,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  biometricDescription: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.lightText,
    textAlign: 'center',
  },
  bottomSection: {
    marginTop: 'auto',
  },
  loginButton: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  loginButtonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: Colors.darkGreen,
    paddingVertical: Spacing.lg,
    textAlign: 'center',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.lightText,
  },
  signUpLink: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.yellow,
  },
});

export default LoginScreen;
