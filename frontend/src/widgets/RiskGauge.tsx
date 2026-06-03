import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getRiskColor } from '../theme/appTheme';

interface RiskGaugeProps {
  score: number;
  radius?: number;
  showLabel?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  radius = 80,
  showLabel = true,
}) => {
  const color = getRiskColor(score);
  const strokeWidth = 14;
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;
  
  // Clamped percent
  const percent = Math.max(0, Math.min(100, score)) / 100;
  
  // Animation for progress
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percent,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, [percent, animatedValue]);

  // Dash offset interpolation
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const getLabel = () => {
    if (score <= 30) return 'Safe';
    if (score <= 70) return 'Medium';
    return 'High Risk';
  };

  return (
    <View style={[styles.container, { width: radius * 2, height: radius * 2 }]}>
      <Svg width={radius * 2} height={radius * 2} style={styles.svg}>
        {/* Background Circle */}
        <Circle
          cx={radius}
          cy={radius}
          r={innerRadius}
          fill="transparent"
          stroke="#E0E0E5"
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <AnimatedCircle
          cx={radius}
          cy={radius}
          r={innerRadius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          // @ts-ignore - animated styling override
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${radius} ${radius})`}
        />
      </Svg>
      
      {/* Center Text Overlay */}
      <View style={styles.textContainer}>
        <Text style={[styles.scoreText, { fontSize: radius * 0.4, color }]}>
          {score}
        </Text>
        {showLabel && (
          <Text style={[styles.labelText, { fontSize: radius * 0.14, color }]}>
            {getLabel()}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  labelText: {
    fontWeight: '600',
    fontFamily: 'System',
    marginTop: 2,
  },
});
