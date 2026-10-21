import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { EnergyAvatar } from './avatar/EnergyAvatar';
import { ActionRow } from '@/components/ActivityUI';
import { currentStreak } from './constancy/calendar';
import { previewHistory } from './constancy/preview';
import { useToday } from './constancy/useToday';
import { useLevelPreview } from './levels/useLevelPreview';
function EnergyRing({ value, label, color, progress }: { value: string; label: string; color: string; progress: number }) {
  const size = 74, radius = 31, length = 2 * Math.PI * radius;
  return <View style={s.ringItem} accessibilityLabel={`${label}: ${value}`}><View style={s.ring}>
    <Svg width={size} height={size} viewBox="0 0 74 74"><Circle cx={37} cy={37} r={radius} stroke={colors.border} strokeWidth={4} fill="none" />{progress > 0 && <Circle cx={37} cy={37} r={radius} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray={`${length * Math.min(100, progress) / 100} ${length}`} transform="rotate(-90 37 37)" />}</Svg>
    <Text style={s.ringValue}>{value}</Text></View><Text style={s.ringLabel}>{label}</Text></View>;
}
export default function JourneyHome() {
  const router = useRouter();
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
      <View style={s.greeting}><Text style={s.hello}>Seu ritmo, {state.name.split(' ')[0]}.</Text>{!apiEnabled && <View style={s.badge}><View style={s.badgeDot}/><Text style={s.badgeText}>DADOS ILUSTRATIVOS</Text></View>}</View>
      <View style={s.stats}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Meu nível: ${evolution.level}. Ver evolução.`} style={s.stat} onPress={() => router.push('/levels')}><Text style={s.statNumber}>{evolution.level || '—'}</Text><Text style={s.statLabel}>NÍVEL</Text></Pressable>
        <View style={[s.stat, s.statMiddle]}><View style={s.evNumber}><Icon name="bolt" color={colors.primary} size={21}/><Text style={s.total}>{daily.total}<Text style={s.evUnit}> EV</Text></Text></View><Text style={s.statLabel}>ENERGIA DE HOJE</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Minha constância: ${streak} dias. Ver calendário.`} style={s.stat} onPress={() => router.push('/constancy')}><Text style={s.statNumber}>{streak} <Text style={s.days}>{streak === 1 ? 'dia' : 'dias'}</Text></Text><Text style={s.statLabel}>CONSTÂNCIA</Text></Pressable>
      </View>
      <View style={s.hero}>
        <EnergyAvatar greenProgress={daily.greenProgress} blueProgress={daily.blueProgress} motion={daily.complete ? 'celebrate' : 'idle'} height={330}/>
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir controles do avatar e ajustar meta diária" onPress={() => router.push(apiEnabled ? '/goal' : '/avatar-lab')} style={s.avatarLink}><Text style={s.avatarLinkText}>{apiEnabled ? 'Minha meta diária' : 'Explorar meu avatar'}</Text><Icon name="arrow" size={13} color={colors.muted}/></Pressable>
      </View>
      <View style={s.goalHeader}><Text style={s.sectionTitle}>Uma meta. Muitas possibilidades.</Text><Pressable accessibilityRole="button" accessibilityLabel="Ajustar meta diária" onPress={() => router.push(apiEnabled ? '/goal' : '/avatar-lab')} hitSlop={8}><Icon name="edit" size={17}/></Pressable></View>
      <Text style={s.goalCopy}>{daily.complete ? 'Meta alcançada.' : `Faltam ${daily.remaining} EV.`} Movimento ou mente: os dois caminhos contam.</Text>
      <View style={s.rings}>
        <EnergyRing label="Física" value={`${energy.green}`} color={colors.lime} progress={energy.green / goal * 100}/>
        <EnergyRing label="Mental" value={`${energy.blue}`} color={colors.primary} progress={energy.blue / goal * 100}/>
        <EnergyRing label={`Meta · ${goal} EV`} value={`${Math.round(daily.progress)}%`} color={colors.text} progress={daily.progress}/>
      </View>
      <View style={s.lower}>
        <Text style={s.sectionTitle}>Sua jornada continua</Text>
        <ActionRow icon="leaf" title="Minha constância" description="Um dia de cada vez. Acompanhe suas metas e seu calendário." color={colors.lime} onPress={() => router.push('/constancy')}/>
        <ActionRow icon="clock" title="Minhas atividades" description={pending ? `${pending} registro(s) aguardando confirmação` : 'Seus momentos e conquistas, no seu tempo'} onPress={() => router.push('/history')}/>
        <ActionRow icon="phone" title="Conectar atividades" description="Consulte passos e treinos do seu aparelho" onPress={() => router.push('/health')}/>
        <ActionRow icon="qr" title="Participar de um evento" description="Encontros que também fazem parte da jornada" onPress={() => router.push('/events')}/>
      </View>
      {(state.offline || storageError) && <Text style={s.goalCopy}>{storageError ? 'Não foi possível salvar neste aparelho.' : 'Sem conexão. Seus registros ficam pendentes.'}</Text>}
      {!apiEnabled && <Text style={s.footnote}>Dados de exemplo. As atividades ainda não atualizam sua energia.</Text>}
      {!!api.error && <Pressable accessibilityRole="button" onPress={() => { void api.refresh().catch(() => {}); }}><Text style={s.goalCopy}>{api.error} Toque para tentar novamente.</Text></Pressable>}
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, body: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 32 }, greeting: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 8, paddingBottom: 22 }, hello: { color: colors.muted, fontFamily: 'Montserrat_400Regular', fontSize: 12 }, badge: { flexDirection: 'row', alignItems: 'center', gap: 5 }, badgeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary }, badgeText: { color: colors.muted, fontSize: 8, letterSpacing: 1.2 }, stats: { flexDirection: 'row', alignItems: 'center' }, stat: { flex: 1, alignItems: 'center', gap: 5 }, statMiddle: { flex: 1.5, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border }, statNumber: { fontFamily: 'Montserrat_600SemiBold', fontSize: 21, color: colors.primary }, days: { fontSize: 13 }, statLabel: { fontFamily: 'Montserrat_500Medium', fontSize: 8, color: colors.muted, letterSpacing: .8 }, evNumber: { flexDirection: 'row', alignItems: 'center', gap: 5 }, total: { fontFamily: 'Montserrat_700Bold', fontSize: 29, color: colors.text }, evUnit: { fontSize: 12, color: colors.muted }, hero: { marginHorizontal: -15, marginTop: 4, alignItems: 'center' }, avatarLink: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36, marginTop: -24 }, avatarLinkText: { color: colors.muted, fontFamily: 'Montserrat_400Regular', fontSize: 10 }, goalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 12 }, sectionTitle: { color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 14 }, goalCopy: { fontFamily: 'Montserrat_400Regular', color: colors.muted, fontSize: 11, lineHeight: 18, marginTop: 7 }, rings: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 }, ringItem: { alignItems: 'center', gap: 9 }, ring: { width: 74, height: 74, justifyContent: 'center', alignItems: 'center' }, ringValue: { position: 'absolute', color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 18 }, ringLabel: { fontFamily: 'Montserrat_400Regular', color: colors.text, fontSize: 10 }, lower: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 22, marginTop: 28 }, footnote: { fontSize: 10, lineHeight: 17, color: colors.muted, marginTop: 20, fontFamily: 'Montserrat_400Regular' } });
