import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { colors } from '@/design/tokens';
import { Icon } from '@/design/Icon';
import { hasAccess, useMock } from '@/mocks/MockProvider';
export function AppHeader({ back = false }: { back?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useMock();
  return <View style={s.header}>
    {back ? <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8} style={s.hit} onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}><Icon name="back" size={25} /></Pressable> : <View style={s.hit} />}
    <View style={s.brand} accessibilityLabel="Bóra"><Image source={require('../../assets/imgs/Logo.png')} style={s.logo}/><Image source={require('../../assets/imgs/Tipo.png')} style={s.type}/></View>
    {pathname === '/profile' || !hasAccess(state) ? <View style={s.hit} /> : <Pressable accessibilityRole="button" accessibilityLabel="Meu perfil" onPress={() => router.navigate('/profile')} style={s.avatar}><Text style={s.initial}>{state.name.trim().charAt(0).toUpperCase() || 'B'}</Text></Pressable>}
  </View>;
}
const s = StyleSheet.create({ header: { flexDirection: 'row', alignItems: 'center', height: 68, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20 }, hit: { width: 42, height: 44, justifyContent: 'center' }, brand: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }, logo: { width: 30, height: 34, resizeMode: 'contain' }, type: { width: 76, height: 29, resizeMode: 'contain', tintColor: colors.text }, avatar: { width: 36, height: 36, borderRadius: 18, borderColor: '#28708A', borderWidth: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginLeft: 6 }, initial: { fontFamily: 'Montserrat_600SemiBold', color: colors.lime, fontSize: 15 } });
