import { Brand } from '@/components/Brand';
import {apiEnabled} from '@/api/session';
import {useNotifications} from '@/notifications/NotificationProvider';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { colors } from '@/design/tokens';
import { Icon } from '@/design/Icon';
import { hasAccess, useMock } from '@/mocks/MockProvider';
export function AppHeader({ back = false }: { back?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useMock();
  const inbox = useNotifications();
  return <View style={s.header}>
    {back ? <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8} style={s.hit} onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}><Icon name="back" size={25} /></Pressable> : <View style={s.hit} />}
    <View style={s.brand}><Brand /></View>
    {apiEnabled && hasAccess(state) && <Pressable accessibilityRole="button" accessibilityLabel={`Notificações, ${inbox.unread} não lidas`} onPress={()=>router.navigate('/notifications')} style={s.notification}><Icon name="bell" size={24} />{inbox.unread > 0 && <View style={s.notificationBadge}><Text style={s.notificationCount}>{inbox.unread > 99 ? '99+' : inbox.unread}</Text></View>}</Pressable>}
    {pathname === '/profile' || !hasAccess(state) ? <View style={s.hit} /> : <Pressable accessibilityRole="button" accessibilityLabel="Meu perfil" onPress={() => router.navigate('/profile')} style={s.avatar}><Text style={s.initial}>{state.name.trim().charAt(0).toUpperCase() || 'B'}</Text></Pressable>}
  </View>;
}
const s = StyleSheet.create({ notification: { width: 42, height: 44, justifyContent: 'center', alignItems: 'center' }, notificationBadge: { position: 'absolute', top: 1, right: 0, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: colors.lime, paddingHorizontal: 3, justifyContent: 'center', alignItems: 'center' }, notificationCount: { color: colors.background, fontFamily: 'Montserrat_600SemiBold', fontSize: 9 }, header: { flexDirection: 'row', alignItems: 'center', height: 68, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20 }, hit: { width: 42, height: 44, justifyContent: 'center' }, brand: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }, avatar: { width: 36, height: 36, borderRadius: 18, borderColor: '#28708A', borderWidth: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginLeft: 6 }, initial: { fontFamily: 'Montserrat_600SemiBold', color: colors.lime, fontSize: 15 } });
