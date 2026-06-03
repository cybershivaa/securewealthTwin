import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../assets/colors/Colors';

const StepProgress = ({ currentStep, totalSteps = 10, labels = [] }) => {
  const defaultLabels = [
    'Mobile', 'OTP', 'Email', 'Personal', 'Bank',
    'Security', 'Device', 'Biometric', 'Terms', 'Done'
  ];
  const stepLabels = labels.length > 0 ? labels : defaultLabels;

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {Array(totalSteps).fill(0).map((_, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isUpcoming = stepNum > currentStep;

          return (
            <View key={index} style={styles.stepItem}>
              {/* Connector line (before step, not for first) */}
              {index > 0 && (
                <View
                  style={[
                    styles.connector,
                    isCompleted || isCurrent
                      ? styles.connectorActive
                      : styles.connectorInactive,
                  ]}
                />
              )}
              {/* Circle */}
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isCurrent && styles.circleCurrent,
                  isUpcoming && styles.circleUpcoming,
                ]}
              >
                {isCompleted ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      isCurrent && styles.stepNumberCurrent,
                    ]}
                  >
                    {stepNum}
                  </Text>
                )}
              </View>
              {/* Label */}
              {stepLabels[index] && (
                <Text
                  style={[
                    styles.label,
                    (isCompleted || isCurrent) && styles.labelActive,
                  ]}
                  numberOfLines={1}
                >
                  {stepLabels[index]}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    top: 14,
    right: '50%',
    width: '100%',
    height: 2,
    zIndex: -1,
  },
  connectorActive: {
    backgroundColor: Colors.yellow,
  },
  connectorInactive: {
    backgroundColor: Colors.borderColor,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  circleCompleted: {
    backgroundColor: Colors.success,
  },
  circleCurrent: {
    backgroundColor: Colors.yellow,
    borderWidth: 2,
    borderColor: Colors.brightYellow,
  },
  circleUpcoming: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.borderColor,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  stepNumber: {
    color: Colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
  },
  stepNumberCurrent: {
    color: Colors.darkGreen,
    fontWeight: '700',
  },
  label: {
    fontSize: 9,
    color: Colors.mutedText,
    textAlign: 'center',
    fontWeight: '500',
  },
  labelActive: {
    color: Colors.yellow,
    fontWeight: '600',
  },
});

export default StepProgress;
