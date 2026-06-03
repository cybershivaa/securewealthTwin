import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegistrationFlow from '../screens/Registration/RegistrationFlow';
import ForgotPasswordFlow from '../screens/Auth/ForgotPassword/ForgotPasswordFlow';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: '#1a3d3a' },
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{ animationTypeForReplace: 'pop' }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen 
        name="Registration" 
        component={RegistrationFlow}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordFlow}
        options={{
          animationEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
