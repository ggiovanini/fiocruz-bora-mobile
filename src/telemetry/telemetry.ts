import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { ComponentType } from 'react';

// Loading expo-observe initializes native services immediately on Android.
// Local builds without an EAS project must not load those services.
const projectId = Constants.expoConfig?.extra?.eas?.projectId;
const telemetry: typeof import('expo-observe') | null =
  Platform.OS !== 'android' && typeof projectId === 'string' && projectId.trim() ? require('expo-observe') : null;
const integrations = { 'expo-router': { filteredParams: ['userId', 'token', 'email'] } };
let consentGranted = false;

telemetry?.Observe.configure({ dispatchingEnabled: false, environment: __DEV__ ? 'development' : 'production', integrations });

export function wrapTelemetryRoot<P extends Record<string, unknown>>(component: ComponentType<P>): ComponentType<P> {
  return telemetry ? telemetry.ObserveRoot.wrap(component) : component;
}

export function setTelemetryConsent(granted: boolean) {
  consentGranted = granted;
  telemetry?.Observe.configure({ dispatchingEnabled: granted, environment: __DEV__ ? 'development' : 'production', integrations });
}

export function track(event: string, attributes: Record<string, string | number | boolean> = {}) {
  if (consentGranted) telemetry?.Observe.logEvent(event, { attributes });
}
