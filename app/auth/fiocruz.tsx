import { Redirect } from 'expo-router';

// The browser session listener consumes the code; this route never authenticates on its own.
export default function InstitutionalReturn() {
  return <Redirect href="/onboarding" />;
}
