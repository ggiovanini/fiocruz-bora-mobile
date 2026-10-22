import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { NotificationProvider } from '@/notifications/NotificationProvider';
import { wrapTelemetryRoot } from "@/telemetry/telemetry";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useFonts } from "expo-font";
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import { colors } from "@/design/tokens";
import { hasAccess, MockProvider, useMock } from "@/mocks/MockProvider";

import { EnergyPreviewProvider } from "@/features/avatar/EnergyPreview";
import { HealthProvider } from "@/health/HealthProvider";
import Introduction from "@/features/introduction/Introduction";
import { useIntroduction } from "@/features/introduction/useIntroduction";

void SplashScreen.preventAutoHideAsync();

function HealthBoundary() {
  const { state, ready } = useMock();
  return (
    <HealthProvider
      key={`${state.userId ?? "prototype"}:${state.membershipId ?? ""}:${hasAccess(state)}:${state.session}`}
      enabled={ready && hasAccess(state)}
      preferenceKey={`bora:health-preferences:v2:${state.userId ?? "prototype"}:${state.membershipId ?? state.organization}`}
    >
      <Navigation />
    </HealthProvider>
  );
}

function Navigation() {
  const { state, ready } = useMock();
  const introduction = useIntroduction();
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });
  useEffect(() => {
    if (introduction.ready && (fontsLoaded || fontError)) void SplashScreen.hideAsync();
  }, [introduction.ready, fontsLoaded, fontError]);
  if (!ready || !introduction.ready || (!fontsLoaded && !fontError))
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator
          accessibilityLabel="Carregando Bóra"
          color={colors.lime}
        />
      </View>
    );
  if (!introduction.completed) return <Introduction onFinish={introduction.finish} />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="presentation" />
      <Stack.Screen name="legal" />
      <Stack.Screen name="about" />
      <Stack.Protected guard={!hasAccess(state)}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={hasAccess(state)}>
        <Stack.Screen name="(tabs)" />
        {[
          "profile",
          "goal",
          "notifications",
          "medals",
          "activity",
          "review",
          "activity-result",
          "history",
          "constancy",
          "levels",
          "health",
          "mission",
          "content",
          "article",
          "events",
          "qr",
          "checkin",
          "edit-profile",
          "privacy",
          "help",
          "demo",
          "avatar-lab",
        ].map((name) => (
          <Stack.Screen key={name} name={name} />
        ))}
      </Stack.Protected>
    </Stack>
  );
}
function PreviewBoundary() {
  const { state } = useMock();
  return <EnergyPreviewProvider key={`${state.userId ?? "prototype"}:${state.membershipId ?? ""}:${state.session}:${state.organization}`}><HealthBoundary /></EnergyPreviewProvider>;
}
function RootLayout() {
  return (
    <MockProvider>
      <NotificationProvider><PreviewBoundary /></NotificationProvider>
    </MockProvider>
  );
}
export default wrapTelemetryRoot(RootLayout);
