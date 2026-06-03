import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import MobileVerificationScreen from '../screens/Auth/MobileVerificationScreen';
import OTPVerificationScreen from '../screens/Auth/OTPVerificationScreen';
import PersonalDetailsScreen from '../screens/Registration/PersonalDetailsScreen';
import BankLinkingScreen from '../screens/Registration/BankLinkingScreen';
import SecuritySetupScreen from '../screens/Registration/SecuritySetupScreen';
import DeviceRegistrationScreen from '../screens/Registration/DeviceRegistrationScreen';
import BiometricSetupScreen from '../screens/Registration/BiometricSetupScreen';
import RegistrationSuccessScreen from '../screens/Registration/RegistrationSuccessScreen';
import LoginScreen from '../screens/Auth/LoginScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MobileVerification" component={MobileVerificationScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
      <Stack.Screen name="BankLinking" component={BankLinkingScreen} />
      <Stack.Screen name="SecuritySetup" component={SecuritySetupScreen} />
      <Stack.Screen name="DeviceRegistration" component={DeviceRegistrationScreen} />
      <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
      <Stack.Screen name="RegistrationSuccess" component={RegistrationSuccessScreen} />
    </Stack.Navigator>
  );
}
