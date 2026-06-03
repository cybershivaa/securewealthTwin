// Lightweight biometrics wrapper. For Expo projects use expo-local-authentication.
import * as LocalAuthentication from 'expo-local-authentication';

export const isBiometricSupported = async (): Promise<boolean> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const saved = await LocalAuthentication.isEnrolledAsync();
    return !!(hasHardware && saved);
  } catch (e) {
    return false;
  }
};

export const authenticate = async (prompt = 'Authenticate') => {
  try {
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: prompt });
    return res.success;
  } catch (e) {
    return false;
  }
};

export default { isBiometricSupported, authenticate };
