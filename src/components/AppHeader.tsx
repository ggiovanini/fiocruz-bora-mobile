import { useRef } from 'react';
import { Brand } from './Brand';
import {apiEnabled} from '@/api/session';
import {useNotifications} from '@/notifications/NotificationProvider';
import { Animated, Pressable, StyleSheet, Text, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/design/tokens';
import { Icon } from '@/design/Icon';
import { hasAccess, useMock } from '@/mocks/MockProvider';
export const APP_HEADER_HEIGHT = 68;

export function useHeaderScroll() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.setValue(Math.max(0, event.nativeEvent.contentOffset.y));
  };
  return { scrollY, onScroll };
}

export function AppHeader({ back = false, scrollY }: { back?: boolean; scrollY?: Animated.Value }) {
  const router = useRouter();
  const { state } = useMock();
  const inbox = useNotifications();
  return <Animated.View style={[s.overlay, scrollY && { backgroundColor: scrollY.interpolate({ inputRange: [0, 48], outputRange: [colors.background, 'rgba(0, 43, 69, 0.88)'], extrapolate: 'clamp' }) }]}><View style={s.header}>
    {back ? <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8} style={s.hit} onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}><Icon name="back" size={25} /></Pressable> : null}
    <View style={s.brand}><Brand compact signatureOpacity={scrollY?.interpolate({ inputRange: [0, 48], outputRange: [1, 0], extrapolate: 'clamp' })} /></View>
    {apiEnabled && hasAccess(state) && <Pressable accessibilityRole="button" accessibilityLabel={`Notificações, ${inbox.unread} não lidas`} onPress={()=>router.navigate('/notifications')} style={s.notification}><Icon name="bell" size={24} />{inbox.unread > 0 && <View style={s.notificationBadge}><Text style={s.notificationCount}>{inbox.unread > 99 ? '99+' : inbox.unread}</Text></View>}</Pressable>}
  </View></Animated.View>;
}
const s = StyleSheet.create({ overlay: { height: APP_HEADER_HEIGHT, marginBottom: -APP_HEADER_HEIGHT, zIndex: 10, backgroundColor: colors.background }, translucent: { backgroundColor: 'rgba(0, 43, 69, 0.88)', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(131, 168, 189, 0.18)' }, symbol: { width: 28, height: 34, resizeMode: 'contain' }, notification: { width: 42, height: 44, justifyContent: 'center', alignItems: 'center' }, notificationBadge: { position: 'absolute', top: 1, right: 0, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: colors.lime, paddingHorizontal: 3, justifyContent: 'center', alignItems: 'center' }, notificationCount: { color: colors.background, fontFamily: 'Montserrat_600SemiBold', fontSize: 9 }, header: { flexDirection: 'row', alignItems: 'center', height: 68, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20 }, hit: { width: 42, height: 44, justifyContent: 'center' }, brand: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 4 } });
