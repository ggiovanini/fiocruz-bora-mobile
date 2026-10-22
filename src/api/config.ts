import { Platform } from 'react-native';

export function getApiBaseUrl(): string {
  const common = process.env.EXPO_PUBLIC_API_URL;
  const android = process.env.EXPO_PUBLIC_ANDROID_API_URL;
  return ((Platform.OS === 'android' ? android || common : common) ?? '').trim().replace(/\/$/, '');
}
