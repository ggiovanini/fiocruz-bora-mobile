import { ObserveRoot, useObserve } from 'expo-observe';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import '@/telemetry/telemetry';
import { colors } from '@/design/tokens';

function RootLayout() {
  const { markInteractive } = useObserve();
  useEffect(() => { markInteractive(); }, [markInteractive]);
  return <Tabs screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, tabBarActiveTintColor: colors.primary }}><Tabs.Screen name="index" options={{ title: 'Hoje' }} /><Tabs.Screen name="missions" options={{ title: 'Missões' }} /><Tabs.Screen name="profile" options={{ title: 'Perfil' }} /></Tabs>;
}

export default ObserveRoot.wrap(RootLayout);
