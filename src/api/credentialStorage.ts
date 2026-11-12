import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Web previews do not persist native credentials or implement institutional login.
let webSession: string | null = null;
const key = 'bora.institutional-session.v1';
export const credentialStorage = {
  get: () => Platform.OS === 'web' ? Promise.resolve(webSession) : SecureStore.getItemAsync(key),
  set: (value: string) => Platform.OS === 'web'
    ? Promise.resolve().then(() => { webSession = value; })
    : SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
  remove: () => Platform.OS === 'web'
    ? Promise.resolve().then(() => { webSession = null; })
    : SecureStore.deleteItemAsync(key),
};
