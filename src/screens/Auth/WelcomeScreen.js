import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Colors } from '../../assets/colors/Colors';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.brandName}>PSB Digital</Text>
          <Text style={styles.tagline}>Welcome!</Text>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.mainHeading}>Welcome to PSB Digital!</Text>
          <Text style={styles.description}>
            Banking App
          </Text>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Registration')}
          >
            <Text style={styles.primaryButtonText}>Get Started →</Text>
          </TouchableOpacity>

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Have account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInLink}>Sign In</Text>
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
    backgroundColor: Colors.darkGreen || '#1a3d3a',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  brandName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white || '#ffffff',
  },
  tagline: {
    fontSize: 14,
    color: Colors.lightGray || '#999999',
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
    marginTop: 40,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white || '#ffffff',
  },
  description: {
    fontSize: 14,
    color: Colors.lightGray || '#999999',
    marginTop: 12,
  },
  bottomSection: {
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: Colors.yellow || '#FFD700',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGreen || '#1a3d3a',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signInText: {
    color: Colors.lightGray || '#999999',
  },
  signInLink: {
    color: Colors.yellow || '#FFD700',
    fontWeight: '600',
  },
});

export default WelcomeScreen;
