import { Redirect } from 'expo-router';

// The browser session listener consumes the code; this route never authenticates on its own.
// Always enter through the session-aware index. Onboarding becomes protected as soon
// as a returning participant signs in, which can race with this deep-link redirect.
export default function InstitutionalReturn() {
  return <Redirect href="/" />;
}
