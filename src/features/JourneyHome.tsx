import { useState } from 'react';
import { Sheet } from '@/ui/Sheet';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { AppHeader } from '@/components/AppHeader';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { apiEnabled } from '@/api/session';
import { useMock } from '@/mocks/MockProvider';
import { useEnergyPreview } from './avatar/EnergyPreview';
import { dailyEnergy } from './avatar/energy';
import { CharacterEnergyCard } from './avatar/CharacterEnergyCard';
import { HomeAvatarStage } from './avatar/HomeAvatarStage';
import { currentStreak } from './constancy/calendar';
import { previewHistory } from './constancy/preview';
import { useToday } from './constancy/useToday';
import { useLevelPreview } from './levels/useLevelPreview';
function EnergyRing({ value, title, color, progress, kind, goal, onPress }: { value: string; title: string; color: string; progress: number; kind: 'physical' | 'mental' | 'goal'; goal: number; onPress: () => void }) {
  const size = 74, radius = 31, length = 2 * Math.PI * radius;
  return <Pressable accessibilityRole="button" accessibilityLabel={kind === 'goal' ? `Meta: ${value} de ${goal} EV. Ver e ajustar meta.` : `${title}: ${value} EV. Escolher atividade.`} onPress={onPress} style={({ pressed }) => [s.ringItem, pressed && { opacity: .7 }]}>
    <Text style={s.ringTitle}>{title}</Text>
    <View style={s.ring}>
      <Svg width={size} height={size} viewBox="0 0 74 74"><Circle cx={37} cy={37} r={radius} stroke={colors.border} strokeWidth={4} fill="none" />{progress > 0 && <Circle cx={37} cy={37} r={radius} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray={`${length * Math.min(100, progress) / 100} ${length}`} transform="rotate(-90 37 37)" />}</Svg>
      <Text adjustsFontSizeToFit numberOfLines={1} style={s.ringValue}>{value}</Text>
    </View>
    <View style={s.ringCaption}>
      {kind === 'goal' ? <Text style={s.goalValue}>{goal} EV</Text> : <Image source={kind === 'physical' ? require('../../assets/images/bean/activity-weight-v1.png') : require('../../assets/images/bean/activity-book-v1.png')} style={s.activityArt} resizeMode="contain" accessible={false}/>}
    </View>
  </Pressable>;
}
export default function JourneyHome() {
  const router = useRouter();
  const [colorsOpen, setColorsOpen] = useState(false);
  const { state, storageError, api } = useMock();
  const { energy, goal } = useEnergyPreview();
  const daily = dailyEnergy(energy.green, energy.blue, goal);
  const today = useToday();
  const evolution = useLevelPreview();
  const streak = apiEnabled ? api.data.energy?.streak_days ?? 0 : currentStreak(today, [...previewHistory(today), { date: today, ...energy, goal }]);
  const pending = state.activities.filter(a => a.status !== 'confirmed').length;
  return <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}>
    <AppHeader />
    <ScrollView refreshControl={apiEnabled ? <RefreshControl refreshing={api.busy} onRefresh={() => { void api.refresh().catch(() => {}); }} tintColor={colors.lime} /> : undefined} contentContainerStyle={s.body}>
      <View style={s.stats}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Meu nível: ${evolution.level}. Ver evolução.`} style={s.stat} onPress={() => router.push('/levels')}><Text style={s.statNumber}>{evolution.level || '—'}</Text><Text style={s.statLabel}>NÍVEL</Text></Pressable>
        <View style={[s.stat, s.statMiddle]}><View style={s.evNumber}><Icon name="bolt" color={colors.primary} size={21}/><Text style={s.total}>{daily.total}<Text style={s.evUnit}> EV</Text></Text></View><Text style={s.statLabel}>ENERGIA DE HOJE</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Minha constância: ${streak} dias. Ver calendário.`} style={s.stat} onPress={() => router.push('/constancy')}><Text style={s.statNumber}>{streak} <Text style={s.days}>{streak === 1 ? 'dia' : 'dias'}</Text></Text><Text style={s.statLabel}>CONSTÂNCIA</Text></Pressable>
      </View>
      <View style={s.hero}>
        <HomeAvatarStage physicalProgress={daily.greenProgress} mentalProgress={daily.blueProgress} complete={daily.complete}/>
      </View>
      <View style={s.rings}>
        <EnergyRing title="Física" value={`${energy.green}`} color={colors.lime} progress={energy.green / goal * 100} kind="physical" goal={goal} onPress={() => router.push({ pathname: '/activity', params: { group: 'movement' } })}/>
        <EnergyRing title="Mental" value={`${energy.blue}`} color={colors.primary} progress={energy.blue / goal * 100} kind="mental" goal={goal} onPress={() => router.push({ pathname: '/activity', params: { group: 'mind' } })}/>
        <EnergyRing title="Meta" value={`${Math.round(daily.progress)}%`} color={colors.text} progress={daily.progress} kind="goal" goal={goal} onPress={() => router.push('/goal')}/>
      </View>
      <View style={s.shortcuts}>
        {([{ icon: 'clock', label: pending ? `Atividades · ${pending}` : 'Atividades', path: '/history' }, { icon: 'phone', label: 'Importar', path: '/health' }, { icon: 'qr', label: 'Eventos', path: '/events' }] as const).map(item => <Pressable key={item.path} accessibilityRole="button" onPress={() => router.push(item.path)} style={s.shortcut}><Icon name={item.icon}/><Text style={s.ringLabel}>{item.label}</Text></Pressable>)}
        <Pressable accessibilityRole="button" onPress={() => setColorsOpen(true)} style={s.shortcut}><Icon name="leaf"/><Text style={s.ringLabel}>Bean</Text></Pressable>
      </View>
      <Sheet visible={colorsOpen} title="Aparência do Bean" onClose={() => setColorsOpen(false)}><CharacterEnergyCard energy={api.data.energy?.character_energy}/></Sheet>
      {(state.offline || storageError) && <Text style={s.goalCopy}>{storageError ? 'Não foi possível salvar neste aparelho.' : 'Sem conexão. Seus registros ficam pendentes.'}</Text>}
      {!apiEnabled && <Text style={s.footnote}>Dados de exemplo. As atividades ainda não atualizam sua energia.</Text>}
      {!!api.error && <Pressable accessibilityRole="button" onPress={() => { void api.refresh().catch(() => {}); }}><Text style={s.goalCopy}>{api.error} Toque para tentar novamente.</Text></Pressable>}
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({ ringTitle: { color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 13 }, ringCaption: { height: 36, justifyContent: 'flex-start', alignItems: 'center' }, activityArt: { width: 58, height: 44, transform: [{ translateY: -8 }] }, goalValue: { color: colors.text, fontFamily: 'Montserrat_500Medium', fontSize: 13 }, shortcuts: { flexDirection: 'row', gap: 8, marginTop: 28 }, shortcut: { flex: 1, minHeight: 62, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: 14 }, safe: { flex: 1, backgroundColor: colors.background }, body: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 32 }, greeting: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 8, paddingBottom: 10 }, hello: { color: colors.muted, fontFamily: 'Montserrat_400Regular', fontSize: 12 }, badge: { flexDirection: 'row', alignItems: 'center', gap: 5 }, badgeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary }, badgeText: { color: colors.muted, fontSize: 8, letterSpacing: 1.2 }, stats: { flexDirection: 'row', alignItems: 'center', marginTop: 10 }, stat: { flex: 1, alignItems: 'center', gap: 5 }, statMiddle: { flex: 1.5, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border }, statNumber: { fontFamily: 'Montserrat_600SemiBold', fontSize: 21, color: colors.primary }, days: { fontSize: 13 }, statLabel: { fontFamily: 'Montserrat_500Medium', fontSize: 8, color: colors.muted, letterSpacing: .8 }, evNumber: { flexDirection: 'row', alignItems: 'center', gap: 5 }, total: { fontFamily: 'Montserrat_700Bold', fontSize: 29, color: colors.text }, evUnit: { fontSize: 12, color: colors.muted }, hero: { marginHorizontal: -24, marginTop: 44, alignItems: 'center' }, avatarLink: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36, marginTop: -24 }, avatarLinkText: { color: colors.muted, fontFamily: 'Montserrat_400Regular', fontSize: 10 }, goalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 12 }, sectionTitle: { color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 14 }, goalCopy: { fontFamily: 'Montserrat_400Regular', color: colors.muted, fontSize: 11, lineHeight: 18, marginTop: 7 }, rings: { flexDirection: 'row', justifyContent: 'space-around', marginTop: -20 }, ringItem: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 4 }, ring: { width: 74, height: 74, justifyContent: 'center', alignItems: 'center' }, ringValue: { position: 'absolute', maxWidth: 60, color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 18 }, ringLabel: { fontFamily: 'Montserrat_400Regular', color: colors.text, fontSize: 10 }, lower: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 22, marginTop: 28 }, footnote: { fontSize: 10, lineHeight: 17, color: colors.muted, marginTop: 20, fontFamily: 'Montserrat_400Regular' } });
