import React, { useState, useEffect } from 'react';
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
import { Colors, Typography, Spacing, BorderRadius } from '../../../assets/colors/Colors';

// ─────────────────────────────────────────────
// Step 1: Mobile Number Entry
// ─────────────────────────────────────────────
const Step1MobileEntry = ({ onNext, isLoading, mobile, setMobile }) => {
  const handleSubmit = () => {
    if (!mobile.trim() || mobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    onNext({ mobile });
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Forgot Password</Text>
      <Text style={styles.stepDescription}>
        Enter the mobile number linked to your PSB Digital account
      </Text>

      <View style={styles.stepContent}>
        <Text style={styles.inputLabel}>Registered Mobile Number</Text>
        <View style={styles.mobileInputContainer}>
          <Text style={styles.countryCode}>IN +91</Text>
          <TextInput
            style={styles.mobileInput}
            placeholder="Enter mobile number"
            placeholderTextColor={Colors.placeholderText}
            keyboardType="phone-pad"
            maxLength={10}
            value={mobile}
            onChangeText={setMobile}
            editable={!isLoading}
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            An OTP will be sent to this number for verification
          </Text>
        </View>

        <LinearGradient
          colors={[Colors.yellow, Colors.brightYellow]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            style={styles.buttonTouchable}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.darkGreen} />
            ) : (
              <Text style={styles.buttonText}>Send OTP →</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// Step 2: OTP Verification
// ─────────────────────────────────────────────
const Step2OTPVerification = ({ onNext, isLoading, mobile }) => {
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);

  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleResendOTP = () => {
    setOtpTimer(60);
    Alert.alert('Success', 'OTP resent to your mobile number');
  };

  const handleVerify = () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    onNext({ otp });
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>OTP Verification</Text>
      <Text style={styles.stepDescription}>
        Enter the 6-digit OTP sent to +91 {mobile}
      </Text>

      <View style={styles.stepContent}>
        <Text style={styles.inputLabel}>Enter OTP</Text>
        <TextInput
          style={styles.input}
          placeholder="000000"
          placeholderTextColor={Colors.placeholderText}
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          editable={!isLoading}
        />

        <View style={styles.otpFooter}>
          <Text style={styles.timerText}>
            {otpTimer > 0 ? `Resend in ${otpTimer}s` : ''}
          </Text>
          {otpTimer === 0 && (
            <TouchableOpacity onPress={handleResendOTP}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        <LinearGradient
          colors={[Colors.yellow, Colors.brightYellow]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <TouchableOpacity
            onPress={handleVerify}
            disabled={isLoading}
            style={styles.buttonTouchable}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.darkGreen} />
            ) : (
              <Text style={styles.buttonText}>Verify OTP →</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// Step 3: Identity Verification (PAN + DOB)
// ─────────────────────────────────────────────
const Step3IdentityVerification = ({ onNext, isLoading }) => {
  const [pan, setPan] = useState('');
  const [dob, setDob] = useState('');

  const handleVerify = () => {
    if (!pan.trim() || pan.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-character PAN number');
      return;
    }
    if (!dob.trim()) {
      Alert.alert('Error', 'Please enter your date of birth');
      return;
    }
    onNext({ pan, dob });
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Identity Verification</Text>
      <Text style={styles.stepDescription}>
        Verify your identity to reset your password
      </Text>

      <View style={styles.stepContent}>
        <Text style={styles.inputLabel}>PAN Number</Text>
        <TextInput
          style={styles.input}
          placeholder="ABCDE1234F"
          placeholderTextColor={Colors.placeholderText}
          maxLength={10}
          autoCapitalize="characters"
          value={pan}
          onChangeText={(val) => setPan(val.toUpperCase())}
          editable={!isLoading}
        />

        <Text style={styles.inputLabel}>Date of Birth</Text>
        <TextInput
          style={styles.input}
          placeholder="DD-MM-YYYY"
          placeholderTextColor={Colors.placeholderText}
          value={dob}
          onChangeText={setDob}
          editable={!isLoading}
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>🔒</Text>
          <Text style={styles.infoText}>
            This information must match your bank records
          </Text>
        </View>

        <LinearGradient
          colors={[Colors.yellow, Colors.brightYellow]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <TouchableOpacity
            onPress={handleVerify}
            disabled={isLoading}
            style={styles.buttonTouchable}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.darkGreen} />
            ) : (
              <Text style={styles.buttonText}>Verify Identity →</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// Step 4: New Password Creation
// ─────────────────────────────────────────────
const Step4NewPassword = ({ onNext, isLoading }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strengthLevel = getPasswordStrength(password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const strengthColors = ['', Colors.error, Colors.warning, Colors.brightYellow, Colors.success, Colors.success];

  const handleSubmit = () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (strengthLevel < 3) {
      Alert.alert('Error', 'Password is too weak. Include uppercase, lowercase, numbers and special characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    onNext({ password });
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Create New Password</Text>
      <Text style={styles.stepDescription}>
        Set a strong password for your account
      </Text>

      <View style={styles.stepContent}>
        <Text style={styles.inputLabel}>New Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Min 8 characters"
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

        {/* Password Strength Indicator */}
        {password.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBar}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.strengthSegment,
                    {
                      backgroundColor:
                        i <= strengthLevel
                          ? strengthColors[strengthLevel]
                          : Colors.cardBackground,
                    },
                  ]}
                />
              ))}
            </View>
            <Text
              style={[
                styles.strengthLabel,
                { color: strengthColors[strengthLevel] || Colors.lightText },
              ]}
            >
              {strengthLabels[strengthLevel]}
            </Text>
          </View>
        )}

        {/* Password Requirements */}
        <View style={styles.requirementsList}>
          <Text style={[styles.requirementItem, password.length >= 8 && styles.requirementMet]}>
            {password.length >= 8 ? '✓' : '○'} At least 8 characters
          </Text>
          <Text style={[styles.requirementItem, /[A-Z]/.test(password) && styles.requirementMet]}>
            {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
          </Text>
          <Text style={[styles.requirementItem, /[a-z]/.test(password) && styles.requirementMet]}>
            {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
          </Text>
          <Text style={[styles.requirementItem, /[0-9]/.test(password) && styles.requirementMet]}>
            {/[0-9]/.test(password) ? '✓' : '○'} One number
          </Text>
          <Text style={[styles.requirementItem, /[^A-Za-z0-9]/.test(password) && styles.requirementMet]}>
            {/[^A-Za-z0-9]/.test(password) ? '✓' : '○'} One special character
          </Text>
        </View>

        <Text style={styles.inputLabel}>Confirm Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Re-enter password"
            placeholderTextColor={Colors.placeholderText}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isLoading}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        {confirmPassword.length > 0 && password !== confirmPassword && (
          <Text style={styles.errorText}>Passwords do not match</Text>
        )}
        {confirmPassword.length > 0 && password === confirmPassword && (
          <Text style={styles.matchText}>✓ Passwords match</Text>
        )}

        <LinearGradient
          colors={[Colors.yellow, Colors.brightYellow]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            style={styles.buttonTouchable}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.darkGreen} />
            ) : (
              <Text style={styles.buttonText}>Reset Password →</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// Step 5: Success Screen
// ─────────────────────────────────────────────
const Step5Success = ({ onGoToLogin }) => {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Text style={styles.successEmoji}>✅</Text>
        </View>
        <Text style={styles.successTitle}>Password Reset!</Text>
        <Text style={styles.successDescription}>
          Your password has been changed successfully. You can now login with your new credentials.
        </Text>

        <View style={styles.successTips}>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>🔒</Text>
            <Text style={styles.tipText}>Never share your password with anyone</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>🔄</Text>
            <Text style={styles.tipText}>Change your password regularly</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>📱</Text>
            <Text style={styles.tipText}>Enable biometric login for convenience</Text>
          </View>
        </View>

        <LinearGradient
          colors={[Colors.yellow, Colors.brightYellow]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, { width: '100%' }]}
        >
          <TouchableOpacity
            onPress={onGoToLogin}
            style={styles.buttonTouchable}
          >
            <Text style={styles.buttonText}>← Back to Login</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════
// Main ForgotPasswordFlow Component
// ═════════════════════════════════════════════
const ForgotPasswordFlow = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    mobile: '',
    otp: '',
    pan: '',
    dob: '',
    password: '',
  });

  const totalSteps = 5;

  const handleNextStep = async (data) => {
    setIsLoading(true);
    try {
      setFormData((prev) => ({ ...prev, ...data }));
      setCurrentStep((prev) => prev + 1);
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleGoToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Header */}
        {currentStep < 5 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <TouchableOpacity onPress={handlePreviousStep}>
                <Text style={styles.backButton}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.progressText}>
                Step {currentStep} of {totalSteps}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(currentStep / totalSteps) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}

        {/* Step Content */}
        <View style={styles.mainContent}>
          {currentStep === 1 && (
            <Step1MobileEntry
              onNext={handleNextStep}
              isLoading={isLoading}
              mobile={formData.mobile}
              setMobile={(val) =>
                setFormData((prev) => ({ ...prev, mobile: val }))
              }
            />
          )}

          {currentStep === 2 && (
            <Step2OTPVerification
              onNext={handleNextStep}
              isLoading={isLoading}
              mobile={formData.mobile}
            />
          )}

          {currentStep === 3 && (
            <Step3IdentityVerification
              onNext={handleNextStep}
              isLoading={isLoading}
            />
          )}

          {currentStep === 4 && (
            <Step4NewPassword
              onNext={handleNextStep}
              isLoading={isLoading}
            />
          )}

          {currentStep === 5 && (
            <Step5Success onGoToLogin={handleGoToLogin} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ═════════════════════════════════════════════
// Styles
// ═════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
  },

  // Progress Bar
  progressContainer: {
    marginBottom: Spacing.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backButton: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.yellow,
  },
  progressText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.lightText,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.yellow,
  },

  // Main Content
  mainContent: {
    marginBottom: Spacing.lg,
  },

  // Step
  stepContainer: {
    marginBottom: Spacing.xl,
  },
  stepTitle: {
    fontSize: Typography.h2.fontSize,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.lightText,
    marginBottom: Spacing.lg,
  },
  stepContent: {
    marginTop: Spacing.lg,
  },

  // Inputs
  inputLabel: {
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
  mobileInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  countryCode: {
    fontSize: Typography.body.fontSize,
    color: Colors.lightText,
    marginRight: Spacing.md,
    fontWeight: '500',
  },
  mobileInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.body.fontSize,
    color: Colors.white,
  },

  // Password
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

  // Password Strength
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: -Spacing.sm,
  },
  strengthBar: {
    flexDirection: 'row',
    flex: 1,
    marginRight: Spacing.md,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  strengthLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },

  // Password Requirements
  requirementsList: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  requirementItem: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.lightText,
    marginBottom: Spacing.sm,
  },
  requirementMet: {
    color: Colors.success,
  },

  // Error / Match text
  errorText: {
    fontSize: Typography.caption.fontSize,
    color: Colors.error,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  matchText: {
    fontSize: Typography.caption.fontSize,
    color: Colors.success,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },

  // OTP
  otpFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  timerText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.lightText,
  },
  resendLink: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.yellow,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.info,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.lightText,
  },

  // Button
  button: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginTop: Spacing.lg,
  },
  buttonTouchable: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: Colors.darkGreen,
  },

  // Success Screen
  successContainer: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
  },
  successIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  successEmoji: {
    fontSize: 44,
  },
  successTitle: {
    fontSize: Typography.h1.fontSize,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  successDescription: {
    fontSize: Typography.body.fontSize,
    color: Colors.lightText,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 24,
  },
  successTips: {
    width: '100%',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tipIcon: {
    fontSize: 18,
    marginRight: Spacing.md,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.lightText,
  },
});

export default ForgotPasswordFlow;
