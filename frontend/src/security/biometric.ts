import ReactNativeBiometrics from 'react-native-biometrics';

const biometrics = new ReactNativeBiometrics();

export async function isBiometricAvailable(): Promise<boolean> {
  const result = await biometrics.isSensorAvailable();
  return result.available;
}

export async function promptBiometricUnlock(promptMessage = 'Unlock SecureWealth Twin'): Promise<boolean> {
  const result = await biometrics.simplePrompt({ promptMessage });
  return result.success;
}
