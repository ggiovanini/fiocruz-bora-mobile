import { Observe } from 'expo-observe';

const integrations = { 'expo-router': { filteredParams: ['userId', 'token', 'email'] } };
let consentGranted = false;

Observe.configure({ dispatchingEnabled: false, environment: __DEV__ ? 'development' : 'production', integrations });

export function setTelemetryConsent(granted: boolean) {
  consentGranted = granted;
  Observe.configure({ dispatchingEnabled: granted, environment: __DEV__ ? 'development' : 'production', integrations });
}

export function track(event: string, attributes: Record<string, string | number | boolean> = {}) {
  if (consentGranted) Observe.logEvent(event, { attributes });
}
