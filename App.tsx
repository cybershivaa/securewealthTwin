import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AppProvider } from './src/providers/AppProvider';

// Screens
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { DeviceScanScreen } from './src/screens/DeviceScanScreen';
import { PaymentSimulationScreen } from './src/screens/PaymentSimulationScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { MonitorScreen } from './src/screens/MonitorScreen';
import { AlertHistoryScreen } from './src/screens/AlertHistoryScreen';

const Stack = createStackNavigator();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <Stack.Navigator
            initialRouteName="Dashboard"
            screenOptions={{
              headerShown: false,
              animationEnabled: true,
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Scan" component={DeviceScanScreen} />
            <Stack.Screen name="Payment" component={PaymentSimulationScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
            <Stack.Screen name="Monitor" component={MonitorScreen} />
            <Stack.Screen name="Alerts" component={AlertHistoryScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}

export default App;
