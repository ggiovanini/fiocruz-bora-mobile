import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens';
import { Icon, type IconName } from '@/design/Icon';
const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: 'home', title: 'Hoje', icon: 'home' },
  { name: 'missions', title: 'Desafios', icon: 'target' },
  { name: 'add', title: 'Adicionar', icon: 'plus' },
  { name: 'ranking', title: 'Ranking', icon: 'trophy' },
  { name: 'discover', title: 'Conhecer', icon: 'book' },
];
export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return <Tabs detachInactiveScreens={false} screenOptions={{
    freezeOnBlur: false,
    // Keep inactive tab layouts intact with opacity transitions. The default
    // display:none fallback collapses GLView to zero size and recreates Expo GL.
    animation: 'fade',
    transitionSpec: { animation: 'timing', config: { duration: 100 } },
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border, elevation: 0, width: '100%', maxWidth: 520, alignSelf: 'center', height: 68 + insets.bottom },
    tabBarLabelStyle: { fontFamily: 'Montserrat_500Medium', fontSize: 10 },
    tabBarHideOnKeyboard: true,
  }}>
    {tabs.map(tab => <Tabs.Screen key={tab.name} name={tab.name}
      listeners={tab.name === 'add' ? { tabPress: event => { event.preventDefault(); router.push('/activity'); } } : undefined}
      options={{
        title: tab.title,
        tabBarIcon: ({ color }) => <Icon name={tab.icon} color={typeof color === 'string' ? color : colors.primary} size={22}/>,
        ...(tab.name === 'add' ? {
          tabBarButton: ({ onPress, onLongPress, testID }) => <Pressable onPress={onPress} onLongPress={onLongPress} testID={testID} accessibilityRole="button" accessibilityLabel="Adicionar atividade" style={({ pressed }) => [s.addTab, pressed && { opacity: .75 }]}>
            <View style={s.addCircle}><Icon name="plus" color={colors.background} size={29}/></View>
            <Text style={s.addLabel}>Adicionar</Text>
          </Pressable>,
        } : {}),
      }}/>) }
  </Tabs>;
}
const s = StyleSheet.create({
  addTab: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 5, minHeight: 68 },
  addCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', marginTop: -12, marginBottom: 5, borderWidth: 4, borderColor: colors.background, boxShadow: '0px 0px 20px #79ff0020' },
  addLabel: { color: colors.text, fontFamily: 'Montserrat_500Medium', fontSize: 10 },
});
