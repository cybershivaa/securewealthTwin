import * as Keychain from 'react-native-keychain';

import type { SecureSession } from '../encryption/types';

const SESSION_ACCOUNT = 'securewealth-session';
const DEVICE_KEY_ACCOUNT = 'securewealth-dilithium-device-key';
const ACCESS_TOKEN_ACCOUNT = 'securewealth-access-token';

export async function storeSecureSession(session: SecureSession): Promise<void> {
  await Keychain.setGenericPassword(SESSION_ACCOUNT, JSON.stringify(session), {
    service: SESSION_ACCOUNT,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadSecureSession(): Promise<SecureSession | null> {
  const credentials = await Keychain.getGenericPassword({ service: SESSION_ACCOUNT });
  if (!credentials) {
    return null;
  }
  return JSON.parse(credentials.password) as SecureSession;
}

export async function clearSecureSession(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SESSION_ACCOUNT });
}

export async function storeDeviceDilithiumKeyPair(keyPair: { publicKeyB64: string; privateKeyB64: string }): Promise<void> {
  await Keychain.setGenericPassword(DEVICE_KEY_ACCOUNT, JSON.stringify(keyPair), {
    service: DEVICE_KEY_ACCOUNT,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadDeviceDilithiumKeyPair(): Promise<{ publicKeyB64: string; privateKeyB64: string } | null> {
  const credentials = await Keychain.getGenericPassword({ service: DEVICE_KEY_ACCOUNT });
  if (!credentials) {
    return null;
  }
  return JSON.parse(credentials.password) as { publicKeyB64: string; privateKeyB64: string };
}

export async function storeAccessToken(token: string): Promise<void> {
  await Keychain.setGenericPassword(ACCESS_TOKEN_ACCOUNT, token, {
    service: ACCESS_TOKEN_ACCOUNT,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadAccessToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({ service: ACCESS_TOKEN_ACCOUNT });
  return credentials ? credentials.password : null;
}

export async function clearAccessToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: ACCESS_TOKEN_ACCOUNT });
}
