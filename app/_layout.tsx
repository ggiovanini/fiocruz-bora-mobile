import { ObserveRoot } from "expo-observe";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useFonts } from "expo-font";
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import "@/telemetry/telemetry";
import { colors } from "@/design/tokens";
import { hasAccess, MockProvider, useMock } from "@/mocks/MockProvider";

import { EnergyPreviewProvider } from "@/features/avatar/EnergyPreview";
import { HealthProvider } from "@/health/HealthProvider";
import Introduction from "@/features/introduction/Introduction";
import { useIntroduction } from "@/features/introduction/useIntroduction";

function HealthBoundary() {
  const { state, ready } = useMock();
  return (
    <HealthProvider
      key={`${hasAccess(state)}:${state.session}:${state.organization}`}
      enabled={ready && hasAccess(state)}
      preferenceKey={`bora:health-preferences:v1:${state.organization}`}
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
      <Stack.Protected guard={!hasAccess(state)}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={hasAccess(state)}>
        <Stack.Screen name="(tabs)" />
        {[
          "profile",
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
  return <EnergyPreviewProvider key={`${state.session}:${state.organization}`}><HealthBoundary /></EnergyPreviewProvider>;
}
function RootLayout() {
  return (
    <MockProvider>
      <PreviewBoundary />
    </MockProvider>
  );
}
export default ObserveRoot.wrap(RootLayout);
