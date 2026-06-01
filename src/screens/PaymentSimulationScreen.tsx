import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, GRADIENTS } from '../theme/appTheme';
import { useApp } from '../providers/AppProvider';
import { DeviceScanner } from '../services/DeviceScanner';
import { GradientButton } from '../widgets/GradientButton';

export const PaymentSimulationScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { calculatePaymentRisk, themeMode } = useApp();
  const isDark = themeMode === 'dark';

  const [amount, setAmount] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [useCustomTime, setUseCustomTime] = useState(false);
  
  // Custom time states
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState(new Date().getMinutes());
  const [showTimeModal, setShowTimeModal] = useState(false);

  const isUnusualHour = (h: number) => h < 6 || h >= 23;

  const formatTimeText = () => {
    const period = selectedHour >= 12 ? 'PM' : 'AM';
    let hours12 = selectedHour % 12;
    hours12 = hours12 === 0 ? 12 : hours12;
    const minStr = selectedMinute < 10 ? `0${selectedMinute}` : `${selectedMinute}`;
    return `${hours12}:${minStr} ${period}`;
  };

  const handleCheckRisk = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsChecking(true);

    // Build transaction date
    const now = new Date();
    const transactionTime = useCustomTime
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), selectedHour, selectedMinute)
      : now;

    // Trigger Native Biometrics if transaction is at an unusual hour
    if (isUnusualHour(transactionTime.getHours())) {
      const authenticated = await DeviceScanner.authenticateBiometrics(
        'Your transaction is at an unusual hour.\nPlease verify your identity to proceed.'
      );

      if (!authenticated) {
        setIsChecking(false);
        Alert.alert(
          'Blocked',
          'Authentication failed. Transaction blocked for your security.'
        );
        return;
      }
    }

    // Calculate risk
    await calculatePaymentRisk(parsedAmount, transactionTime);
    setIsChecking(false);

    // Go to result
    navigation.navigate('Result');
  };

  const screenBg = isDark ? '#121220' : '#F5F5FA';
  const cardBg = isDark ? '#1E1E2E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A2E';
  const subTextColor = isDark ? 'rgba(255,255,255,0.6)' : '#666677';
  const inputBg = isDark ? '#121220' : '#F5F5FA';
  const inputBorder = isDark ? '#3A3A4E' : '#E0E0E0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.appBarTitle, { color: textColor }]}>⬅️  Simulate Payment</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header gradient banner */}
        <LinearGradient colors={GRADIENTS.primary} style={styles.headerCard}>
          <View style={styles.headerIconBox}>
            <Text style={{ fontSize: 24 }}>💳</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Payment Risk Check</Text>
            <Text style={styles.headerDesc}>Enter details to analyze transaction risk</Text>
          </View>
        </LinearGradient>

        {/* Amount Input */}
        <Text style={[styles.inputLabel, { color: subTextColor, marginTop: 32 }]}>
          Transaction Amount
        </Text>
        <View
          style={[
            styles.inputBox,
            { backgroundColor: cardBg, borderColor: inputBorder },
          ]}
        >
          <Text style={[styles.currencyPrefix, { color: COLORS.primary }]}>₹ </Text>
          <TextInput
            style={[styles.amountInput, { color: textColor }]}
            placeholder="0.00"
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.2)' : '#CCC'}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Time Card */}
        <Text style={[styles.inputLabel, { color: subTextColor, marginTop: 24 }]}>
          Transaction Time
        </Text>
        <View style={[styles.timeCard, { backgroundColor: cardBg }]}>
          <View style={styles.timeRow}>
            <View style={styles.timeLabelBox}>
              <Text style={{ fontSize: 18, marginRight: 10 }}>⏰</Text>
              <Text style={[styles.timeValueText, { color: textColor }]}>
                {useCustomTime ? formatTimeText() : 'Current Time (Auto)'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (useCustomTime) {
                  setShowTimeModal(true);
                } else {
                  setUseCustomTime(true);
                  setShowTimeModal(true);
                }
              }}
            >
              <Text style={[styles.timeBtnText, { color: COLORS.primary }]}>
                {useCustomTime ? 'Change' : 'Set Manual'}
              </Text>
            </TouchableOpacity>
          </View>

          {useCustomTime && (
            <TouchableOpacity
              onPress={() => setUseCustomTime(false)}
              style={styles.resetBtn}
            >
              <Text style={[styles.resetBtnText, { color: subTextColor }]}>
                Reset to auto
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Risk Warning Note */}
        <View
          style={[
            styles.warningNote,
            {
              backgroundColor: 'rgba(255, 183, 77, 0.08)',
              borderColor: 'rgba(255, 183, 77, 0.2)',
            },
          ]}
        >
          <Text style={{ fontSize: 18, marginRight: 10 }}>ℹ️</Text>
          <Text style={styles.warningNoteText}>
            Transactions &gt; ₹20,000 or at unusual hours (11 PM – 6 AM) may flag higher risk.
          </Text>
        </View>

        {/* Submit */}
        <GradientButton
          text="Check Risk"
          onPressed={isChecking ? null : handleCheckRisk}
          isLoading={isChecking}
          style={{ marginTop: 32 }}
        />
      </ScrollView>

      {/* Manual Time Picker Modal */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Choose Transaction Hour</Text>
            
            {/* Hour select rows */}
            <ScrollView style={styles.hoursList} contentContainerStyle={{ paddingBottom: 20 }}>
              {Array.from({ length: 24 }).map((_, idx) => {
                const hourLabel = idx === 0 ? '12:00 AM (Midnight)' : idx === 12 ? '12:00 PM (Noon)' : idx > 12 ? `${idx - 12}:00 PM` : `${idx}:00 AM`;
                const isSelected = selectedHour === idx;
                const isUnusual = isUnusualHour(idx);
                
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setSelectedHour(idx);
                      setSelectedMinute(0);
                      setShowTimeModal(false);
                    }}
                    style={[
                      styles.hourRow,
                      {
                        backgroundColor: isSelected ? COLORS.primary : 'transparent',
                        borderColor: inputBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.hourText, { color: isSelected ? '#FFF' : textColor }]}>
                      {hourLabel}
                    </Text>
                    {isUnusual && (
                      <Text style={[styles.unusualTimeBadge, { color: isSelected ? '#FFF' : COLORS.warning }]}>
                        Unusual Hour ⚠️
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <TouchableOpacity onPress={() => setShowTimeModal(false)} style={styles.closeModalBtn}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  headerIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  headerDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'System',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    padding: 0,
  },
  timeCard: {
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeValueText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'System',
  },
  timeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  resetBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  resetBtnText: {
    fontSize: 12,
    fontFamily: 'System',
  },
  warningNote: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  warningNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.warning,
    fontFamily: 'System',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
    marginBottom: 16,
    textAlign: 'center',
  },
  hoursList: {
    width: '100%',
  },
  hourRow: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hourText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  unusualTimeBadge: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'System',
  },
  closeModalBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
});
