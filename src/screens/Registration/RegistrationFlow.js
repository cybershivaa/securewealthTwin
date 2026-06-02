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
import { useDispatch, useSelector } from 'react-redux';
import { Colors, Typography, Spacing, BorderRadius } from '../../assets/colors/Colors';
import {
  setRegistrationStep,
  setMobileNumber,
} from '../../redux/actions/registrationActions';

/**
 * Step 1: Mobile Verification
 */
const Step1MobileVerification = ({ onNext, isLoading, mobile, setMobile }) => {
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleSendOTP = async () => {
    if (!mobile.trim()) {
      Alert.alert('Error', 'Please enter mobile number');
      return;
    }
    setShowOTP(true);
    setOtpTimer(60);
    Alert.alert('Success', 'OTP sent to your mobile number');
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Error', 'Please enter valid 6-digit OTP');
      return;
    }
    onNext({ mobile });
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Mobile Verification</Text>
      <Text style={styles.stepDescription}>
        Use the mobile number linked to your bank account
      </Text>

      <View style={styles.stepContent}>
        <Text style={styles.inputLabel}>Mobile Number</Text>
        <View style={styles.mobileInputContainer}>
          <Text style={styles.countryCode}>IN +91</Text>
          <TextInput
            style={styles.mobileInput}
            placeholder="9142399020"
            placeholderTextColor={Colors.placeholderText}
            keyboardType="phone-pad"
            maxLength={10}
            value={mobile}
            onChangeText={setMobile}
            editable={!isLoading && !showOTP}
          />
        </View>

        {!showOTP ? (
          <LinearGradient
            colors={[Colors.yellow, Colors.brightYellow]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <TouchableOpacity
              onPress={handleSendOTP}
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
        ) : (
          <>
            <Text style={styles.inputLabel}>Enter OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor={Colors.placeholderText}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
            <View style={styles.otpFooter}>
              <Text style={styles.timerText}>
                {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
              </Text>
              {otpTimer === 0 && (
                <TouchableOpacity onPress={handleSendOTP}>
                  <Text style={styles.resendLink}>Send again</Text>
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
                onPress={handleVerifyOTP}
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
          </>
        )}
      </View>
    </View>
  );
};

/**
 * Registration Flow Component
 */
const RegistrationFlow = ({ navigation }) => {
  const dispatch = useDispatch();
  const currentStep = useSelector((state) => state.registration.step);
  const registrationData = useSelector((state) => state.registration);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    mobile: registrationData.mobileNumber || '',
    email: registrationData.email || '',
    fullName: registrationData.fullName || '',
    dob: registrationData.dob || '',
    pan: registrationData.pan || '',
    aadhaar: registrationData.aadhaar || '',
    gender: registrationData.gender || '',
    accountNumber: registrationData.accountNumber || '',
    cifNumber: registrationData.cifNumber || '',
    cardLast6: registrationData.cardLast6 || '',
    username: registrationData.username || '',
    password: registrationData.password || '',
    mpin: registrationData.mpin || '',
  });

  const handleNextStep = async (data) => {
    setIsLoading(true);
    try {
      setFormData((prev) => ({ ...prev, ...data }));
      dispatch(setRegistrationStep(currentStep + 1));
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to proceed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      dispatch(setRegistrationStep(currentStep - 1));
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <TouchableOpacity onPress={handlePreviousStep}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.progressText}>Step {currentStep} of 8</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(currentStep / 8) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Step Content */}
        <View style={styles.mainContent}>
          {currentStep === 1 && (
            <Step1MobileVerification
              onNext={handleNextStep}
              isLoading={isLoading}
              mobile={formData.mobile}
              setMobile={(val) => setFormData((prev) => ({ ...prev, mobile: val }))}
            />
          )}

          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Email Verification</Text>
              <Text style={styles.stepDescription}>
                Enter your email to complete registration
              </Text>
              <View style={styles.stepContent}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.placeholderText}
                  keyboardType="email-address"
                  value={formData.email}
                  onChangeText={(val) =>
                    setFormData((prev) => ({ ...prev, email: val }))
                  }
                />
                <LinearGradient
                  colors={[Colors.yellow, Colors.brightYellow]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <TouchableOpacity
                    onPress={() => handleNextStep({ email: formData.email })}
                    style={styles.buttonTouchable}
                  >
                    <Text style={styles.buttonText}>Continue →</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          )}

          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Personal Information</Text>
              <Text style={styles.stepDescription}>Let's verify your account</Text>
              <View style={styles.stepContent}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="As on Aadhaar / PAN"
                  placeholderTextColor={Colors.placeholderText}
                  value={formData.fullName}
                  onChangeText={(val) =>
                    setFormData((prev) => ({ ...prev, fullName: val }))
                  }
                />

                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD-MM-YYYY"
                  placeholderTextColor={Colors.placeholderText}
                  value={formData.dob}
                  onChangeText={(val) =>
                    setFormData((prev) => ({ ...prev, dob: val }))
                  }
                />

                <Text style={styles.inputLabel}>PAN Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ABCDE1234F"
                  placeholderTextColor={Colors.placeholderText}
                  value={formData.pan}
                  onChangeText={(val) =>
                    setFormData((prev) => ({ ...prev, pan: val.toUpperCase() }))
                  }
                />

                <LinearGradient
                  colors={[Colors.yellow, Colors.brightYellow]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <TouchableOpacity
                    onPress={() =>
                      handleNextStep({
                        fullName: formData.fullName,
                        dob: formData.dob,
                        pan: formData.pan,
                      })
                    }
                    style={styles.buttonTouchable}
                  >
                    <Text style={styles.buttonText}>Continue →</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          )}

          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Bank Account Details</Text>
              <Text style={styles.stepDescription}>
                Verify your PSB bank account
              </Text>
              <View style={styles.stepContent}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter account number"
                  placeholderTextColor={Colors.placeholderText}
                  keyboardType="number-pad"
                  value={formData.accountNumber}
                  onChangeText={(val) =>
                    setFormData((prev) => ({ ...prev, accountNumber: val }))
                  }
                />

                <Text style={styles.inputLabel}>Debit Card Last 6 Digits</Text>
                <TextInput
                  style={styles.input}
                  placeholder="000000"
                  placeholderTextColor={Colors.placeholderText}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={formData.cardLast6}
                  onChangeText={(val) =>
                    setFormData((prev) => ({ ...prev, cardLast6: val }))
                  }
                />

                <LinearGradient
                  colors={[Colors.yellow, Colors.brightYellow]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <TouchableOpacity
                    onPress={() =>
                      handleNextStep({
                        accountNumber: formData.accountNumber,
                        cardLast6: formData.cardLast6,
                      })
                    }
                    style={styles.buttonTouchable}
                  >
                    <Text style={styles.buttonText}>Continue →</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          )}

          {currentStep === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Create Credentials</Text>
              <Text style={styles.stepDescription}>
                Set up your login credentials
              </Text>
              <View style={styles.stepContent}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Choose a username"
                  placeholderTextColor={Colors.placeholderText}
                  value={formData.username}
                  onChangeText={(val) =>
                    setFormData((prev) => ({ ...prev, username: val }))
                  }
                />

                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min 8 chars, 1 Upper, 1 Lower, 1 Number, 1 Special"
                  placeholderTextColor={Colors.placeholderText}
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(val) =>
                    setFormData((prev) => ({ ...prev, password: val }))
                  }
                />

                <Text style={styles.inputLabel}>MPIN (4-6 digits)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••"
                  placeholderTextColor={Colors.placeholderText}
                  secureTextEntry
                  keyboardType="number-pad"
                  maxLength={6}
                  value={formData.mpin}
                  onChangeText={(val) =>
                    setFormData((prev) => ({ ...prev, mpin: val }))
                  }
                />

                <LinearGradient
                  colors={[Colors.yellow, Colors.brightYellow]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <TouchableOpacity
                    onPress={() =>
                      handleNextStep({
                        username: formData.username,
                        password: formData.password,
                        mpin: formData.mpin,
                      })
                    }
                    style={styles.buttonTouchable}
                  >
                    <Text style={styles.buttonText}>Continue →</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          )}

          {currentStep === 6 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Face ID Registration</Text>
              <Text style={styles.stepDescription}>
                Register your face for secure login
              </Text>
              <View style={styles.stepContent}>
                <View style={styles.cameraPlaceholder}>
                  <Text style={styles.cameraIcon}>📸</Text>
                  <Text style={styles.cameraText}>Position your face in oval</Text>
                </View>

                <LinearGradient
                  colors={[Colors.yellow, Colors.brightYellow]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <TouchableOpacity
                    onPress={() => handleNextStep({})}
                    style={styles.buttonTouchable}
                  >
                    <Text style={styles.buttonText}>📷 Capture & Verify</Text>
                  </TouchableOpacity>
                </LinearGradient>

                <TouchableOpacity style={styles.skipButton}>
                  <Text style={styles.skipButtonText}>Skip for now</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {currentStep === 7 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Device Biometric</Text>
              <Text style={styles.stepDescription}>
                Secure high-value payments
              </Text>
              <View style={styles.stepContent}>
                <View style={styles.biometricInfo}>
                  <Text style={styles.biometricEmoji}>🔐</Text>
                  <Text style={styles.biometricDesc}>
                    Windows Hello / Fingerprint / Security Key
                  </Text>
                </View>

                <LinearGradient
                  colors={[Colors.yellow, Colors.brightYellow]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <TouchableOpacity
                    onPress={() => handleNextStep({})}
                    style={styles.buttonTouchable}
                  >
                    <Text style={styles.buttonText}>👆 Register Biometric</Text>
                  </TouchableOpacity>
                </LinearGradient>

                <TouchableOpacity style={styles.skipButton}>
                  <Text style={styles.skipButtonText}>Skip - Set Up Later</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {currentStep === 8 && (
            <View style={styles.stepContainer}>
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Text style={styles.successEmoji}>🎉</Text>
                </View>
                <Text style={styles.successTitle}>Account Ready!</Text>
                <Text style={styles.successDescription}>
                  Your Punjab & Sind Bank UPI account is fully set up
                </Text>

                <View style={styles.successBadges}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeIcon}>📱</Text>
                    <Text style={styles.badgeText}>Mobile Verified</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeIcon}>🏦</Text>
                    <Text style={styles.badgeText}>Bank Linked</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeIcon}>✓</Text>
                    <Text style={styles.badgeText}>KYC Complete</Text>
                  </View>
                </View>

                <View style={styles.upiIdContainer}>
                  <Text style={styles.upiLabel}>YOUR UPI ID</Text>
                  <Text style={styles.upiId}>@psb</Text>
                </View>

                <LinearGradient
                  colors={[Colors.yellow, Colors.brightYellow]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Dashboard')}
                    style={styles.buttonTouchable}
                  >
                    <Text style={styles.buttonText}>🚀 Go to Dashboard →</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          )}
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
  mainContent: {
    marginBottom: Spacing.lg,
  },
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
  skipButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.yellow,
  },
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
  cameraPlaceholder: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  cameraIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  cameraText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.lightText,
  },
  biometricInfo: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  biometricEmoji: {
    fontSize: 40,
    marginBottom: Spacing.md,
  },
  biometricDesc: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.lightText,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successEmoji: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: Typography.h1.fontSize,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  successDescription: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.lightText,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  successBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  badge: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    margin: Spacing.sm,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  badgeIcon: {
    fontSize: 20,
    marginBottom: Spacing.sm,
  },
  badgeText: {
    fontSize: Typography.caption.fontSize,
    color: Colors.white,
    fontWeight: '600',
  },
  upiIdContainer: {
    backgroundColor: Colors.yellow,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  upiLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    color: Colors.darkGreen,
    marginBottom: Spacing.sm,
  },
  upiId: {
    fontSize: Typography.h2.fontSize,
    fontWeight: '700',
    color: Colors.darkGreen,
  },
});

export default RegistrationFlow;
