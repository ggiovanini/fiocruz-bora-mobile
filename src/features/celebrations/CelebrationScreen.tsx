import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens';
import { Icon } from '@/design/Icon';
import { Button } from '@/ui/Flow';
import { MedalBadge } from '../MedalBadge';
import { celebrationDate, type Celebration } from './model';

export function CelebrationScreen({ item, word, onClose, busy }: { item: Celebration; word: string; onClose: () => void; busy: boolean }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [motion, setMotion] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced => { if (live) setMotion(!reduced); }).catch(() => { if (live) setMotion(false); });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', reduced => setMotion(!reduced));
    return () => { live = false; listener.remove(); };
  }, []);
  useEffect(() => {
    progress.setValue(0);
    if (motion === null) return;
    if (!motion) { progress.setValue(1); return; }
    const animation = Animated.spring(progress, { toValue: 1, friction: 7, tension: 45, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [motion, progress, item.id]);
  const { payload } = item;
  useEffect(() => { AccessibilityInfo.announceForAccessibility(`${payload.title} ${payload.name}`); }, [item.id, payload.title, payload.name]);
  return <Modal visible animationType="none" presentationStyle="fullScreen" onRequestClose={onClose} onShow={() => AccessibilityInfo.announceForAccessibility(`${payload.title} ${payload.name}`)}>
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text accessibilityRole="header" style={s.title}>{payload.title}</Text>
        <Animated.View style={[s.visual, { opacity: motion === false ? 1 : progress, transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [.75, 1] }) }] }]}>
          {item.type === 'achievement_awarded' ? <MedalBadge size={168} variant={payload.style ?? 'achievement'} name={payload.name} imageUrl={payload.image_url}/> :
            <View style={s.symbol}><Icon name={item.type === 'level_up' ? 'trophy' : item.type === 'event_checked_in' ? 'calendar' : 'bolt'} size={76} color={colors.lime}/></View>}
        </Animated.View>
        <Text style={s.name}>{payload.name}</Text>
        {payload.date && <Text style={s.date}>{celebrationDate(payload.date)}</Text>}
        {!!payload.description && <Text style={s.message}>{payload.description}</Text>}
      </ScrollView>
      <View style={s.footer}><Button title={word} onPress={onClose} disabled={busy}/></View>
    </SafeAreaView>
  </Modal>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 20, width: '100%', maxWidth: 560, alignSelf: 'center' },
  title: { color: colors.text, fontFamily: 'Montserrat_700Bold', fontSize: 28, textAlign: 'center' },
  visual: { marginVertical: 8 },
  symbol: { width: 176, height: 176, borderRadius: 88, backgroundColor: '#073B59', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.lime },
  name: { color: colors.text, fontFamily: 'Montserrat_700Bold', fontSize: 23, textAlign: 'center' },
  date: { color: colors.muted, fontFamily: 'Montserrat_500Medium', fontSize: 14, textAlign: 'center' },
  message: { color: colors.text, fontFamily: 'Montserrat_500Medium', fontSize: 16, lineHeight: 25, textAlign: 'center' },
  footer: { padding: 24, paddingTop: 12, width: '100%', maxWidth: 560, alignSelf: 'center' },
});
