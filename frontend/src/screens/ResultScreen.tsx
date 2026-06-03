import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, GRADIENTS, getRiskColor } from '../theme/appTheme';
import { useApp } from '../providers/AppProvider';
import { RiskGauge } from '../widgets/RiskGauge';
import { GradientButton } from '../widgets/GradientButton';

export const ResultScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { riskScore, themeMode } = useApp();
  const isDark = themeMode === 'dark';

  const isAllowed = riskScore.level !== 'high';

  const getVerdictLabel = () => {
    return isAllowed ? '✅ Allow Payment' : '🚨 Block / Warn';
  };

  const getVerdictDesc = () => {
    return isAllowed
      ? 'This transaction appears safe to proceed'
      : 'This transaction has been flagged as high risk';
  };

  const getVerdictGradient = () => {
    return isAllowed ? GRADIENTS.safe : GRADIENTS.danger;
  };

  const getScoreIcon = () => {
    switch (riskScore.level) {
      case 'safe':
        return '🛡️';
      case 'medium':
        return '⚠️';
      case 'high':
        return '🛑';
    }
  };

  const getRiskLabelText = () => {
    switch (riskScore.level) {
      case 'safe':
        return 'Safe';
      case 'medium':
        return 'Medium Risk';
      case 'high':
        return 'High Risk';
    }
  };

  const screenBg = isDark ? '#121220' : '#F5F5FA';
  const cardBg = isDark ? '#1E1E2E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A2E';
  const subTextColor = isDark ? 'rgba(255,255,255,0.6)' : '#666677';
  const sectionTitleColor = isDark ? '#FFFFFF' : '#2D2D3A';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.appBarTitle, { color: textColor }]}>⬅️  Risk Assessment</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Verdict Banner */}
        <LinearGradient
          colors={getVerdictGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.verdictBanner}
        >
          <Text style={styles.verdictIcon}>{isAllowed ? '✅' : '🛑'}</Text>
          <Text style={styles.verdictTitle}>{getVerdictLabel()}</Text>
          <Text style={styles.verdictDesc}>{getVerdictDesc()}</Text>
        </LinearGradient>

        {/* Risk Score Gauge Card */}
        <View style={[styles.gaugeCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.gaugeLabel, { color: subTextColor }]}>Risk Score</Text>
          <RiskGauge score={riskScore.score} radius={80} />
        </View>

        {/* Contributing reasons list */}
        <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>Risk Factors</Text>
        
        {riskScore.reasons.map((reason, idx) => {
          const isRisk = reason !== 'No risk factors detected';
          const reasonColor = isRisk ? COLORS.danger : COLORS.safe;
          return (
            <View
              key={idx}
              style={[
                styles.factorRow,
                {
                  backgroundColor: `${reasonColor}0D`,
                  borderColor: `${reasonColor}2D`,
                },
              ]}
            >
              <Text style={{ fontSize: 18, marginRight: 12 }}>{isRisk ? '⚠️' : '✅'}</Text>
              <Text style={[styles.factorText, { color: textColor }]}>{reason}</Text>
            </View>
          );
        })}

        {/* Risk level overview card */}
        <View style={[styles.overviewCard, { backgroundColor: cardBg }]}>
          <View style={[styles.iconBox, { backgroundColor: `${getRiskColor(riskScore.score)}1A` }]}>
            <Text style={styles.overviewIcon}>{getScoreIcon()}</Text>
          </View>
          <View style={styles.overviewTextContainer}>
            <Text style={[styles.overviewLabel, { color: subTextColor }]}>Risk Level</Text>
            <Text style={[styles.overviewValue, { color: getRiskColor(riskScore.score) }]}>
              {getRiskLabelText()}
            </Text>
          </View>
          <Text style={[styles.scoreValText, { color: getRiskColor(riskScore.score) }]}>
            {riskScore.score}/100
          </Text>
        </View>

        {/* Actions */}
        <GradientButton
          text="Back to Dashboard"
          onPressed={() => {
            navigation.navigate('Dashboard');
          }}
          style={{ marginTop: 24 }}
        />

        <GradientButton
          text="New Simulation"
          onPressed={() => navigation.goBack()}
          gradient={GRADIENTS.secondary}
          style={{ marginTop: 12 }}
        />
      </ScrollView>
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
  verdictBanner: {
    width: '100%',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    marginBottom: 28,
  },
  verdictIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  verdictTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  verdictDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'System',
    marginTop: 4,
    textAlign: 'center',
  },
  gaugeCard: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginBottom: 20,
  },
  gaugeLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  factorRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  factorText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
    flex: 1,
  },
  overviewCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginTop: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  overviewIcon: {
    fontSize: 24,
  },
  overviewTextContainer: {
    flex: 1,
  },
  overviewLabel: {
    fontSize: 12,
    fontFamily: 'System',
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  scoreValText: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
});
