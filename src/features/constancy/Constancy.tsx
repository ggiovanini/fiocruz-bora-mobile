import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { apiEnabled } from '@/api/session';
import { useMock } from '@/mocks/MockProvider';
import { useRouter } from 'expo-router';
import { Flow, Button } from '@/ui/Flow';
import { colors } from '@/design/tokens';
import { Icon } from '@/design/Icon';
import { useEnergyPreview } from '../avatar/EnergyPreview';
import { dailyEnergy } from '../avatar/energy';
import {
  completedInMonth, currentStreak, dayStatus, localDate, monthCells, shiftDay, shiftMonth,
  type DayStatus,
} from './calendar';
import { previewHistory } from './preview';
import { useToday } from './useToday';

const weekdayLabels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const statusLabels: Record<DayStatus, string> = { complete: 'Meta alcançada', partial: 'Em progresso', empty: 'Sem EV neste dia', future: 'Dia futuro' };
function formatDate(date: string) { return localDate(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }); }

function Day({ date, today, status, selected, weekly, onPress }: {
  date: string; today: string; status: DayStatus; selected: boolean; weekly?: boolean; onPress: () => void;
}) {
  const future = status === 'future';
  const { width } = useWindowDimensions();
  const circleSize = Math.max(16, Math.min(32, (Math.min(width, 520) - 86) / 7 - 8));
  return <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled: future }} disabled={future}
    accessibilityLabel={`${formatDate(date)}${date === today ? ', hoje' : ''}. ${statusLabels[status]}. Ver detalhes de EV.`}
    onPress={onPress} style={({ pressed }) => [s.dayCell, future && s.future, pressed && s.pressed]}>
    <View style={[s.selection, { width: circleSize + 8, height: circleSize + 8 }, selected && s.selected]}>
      <View style={[s.dayCircle, { width: circleSize, height: circleSize }, status === 'complete' && s.complete, status === 'partial' && s.partial, date === today && s.todayCircle]}>
        {weekly ? status === 'complete' ? <Icon name="check" size={20} color={colors.background} /> : status === 'partial' ? <View style={s.progressDot} /> : null : <Text style={[s.dayNumber, status === 'complete' && s.completeNumber]}>{localDate(date).getDate()}</Text>}
      </View>
    </View>
    <View style={s.dayMark}>{weekly ? <Text style={[s.weekDate, date === today && { color: colors.primary }]}>{date === today ? 'Hoje' : localDate(date).getDate()}</Text> : date === today ? <View style={s.todayDot} /> : null}</View>
  </Pressable>;
}

export default function Constancy() {
  const router = useRouter();
  const { api } = useMock();
  const [loadError, setLoadError] = useState('');
  const today = useToday();
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const previousToday = useRef(today);
  const scroll = useRef<ScrollView>(null);
  const calendarOffset = useRef(0);
  const { energy, goal } = useEnergyPreview();
  useEffect(() => {
    const previous = previousToday.current;
    if (previous !== today) {
      setSelected(value => value === previous ? today : value);
      setMonth(value => value === previous.slice(0, 7) ? today.slice(0, 7) : value);
      previousToday.current = today;
    }
  }, [today]);
  useEffect(() => {
    if (!apiEnabled) return;
    setLoadError('');
    void api.loadEnergyMonth(month).catch(error => setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar o mês.'));
  }, [month]);
  const records = apiEnabled ? (api.data.energy?.days ?? []).map(day => ({ date: day.date, green: day.physical_ev, blue: day.intellectual_ev, goal: day.goal_ev }))
    : [...previewHistory(today), { date: today, ...energy, goal }];
  const byDate = new Map(records.map(day => [day.date, day]));
  const streak = apiEnabled ? api.data.energy?.streak_days ?? 0 : currentStreak(today, records);
  const week = Array.from({ length: 7 }, (_, index) => shiftDay(today, index - 6));
  const cells = monthCells(month);
  const record = byDate.get(selected);
  const daily = record ? dailyEnergy(record.green, record.blue, record.goal) : null;
  const currentMonth = today.slice(0, 7);
  const monthLabel = localDate(`${month}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  function select(date: string) { setSelected(date); setMonth(date.slice(0, 7)); }
  function browseMonth(delta: number) {
    const next = shiftMonth(month, delta);
    setMonth(next);
    setSelected(next === currentMonth ? today : `${next}-01`);
  }
  return <Flow title="Minha constância" scrollRef={scroll}>
    <Text style={s.intro}>Um dia de cada vez. Cada combinação de movimento e mente faz parte da sua jornada.</Text>
    {!apiEnabled && <Text style={s.previewTag}>HISTÓRICO ILUSTRATIVO</Text>}
    {!!loadError && <><Text style={s.support}>{loadError}</Text><Button title="Tentar novamente" onPress={() => { void api.loadEnergyMonth(month).then(() => setLoadError('')).catch(() => {}); }} /></>}
    <View style={s.streakCard}>
      <View style={s.cardTop}><View style={s.iconBadge}><Icon name="leaf" color={colors.lime} size={24} /></View><Text style={s.eyebrow}>SEU RITMO, SUA JORNADA</Text></View>
      <Text style={s.streakValue}>{streak}<Text style={s.streakUnit}> {streak === 1 ? 'dia' : 'dias'}</Text></Text>
      <Text style={s.streakDescription}>com a meta de EV alcançada em sequência</Text>
      <Text style={s.support}>{dayStatus(today, today, byDate.get(today)) === 'complete' ? 'Você completou a meta de hoje. Cada dia conta.' : streak ? 'Sua sequência segue até ontem. Hoje ainda está em andamento.' : 'Sua próxima atividade pode ser o primeiro passo.'}</Text>
    </View>
    <View style={s.weekCard}>
      <View style={s.sectionRow}><Text style={s.sectionTitle}>Um dia de cada vez</Text><Pressable accessibilityRole="button" accessibilityLabel="Ver calendário mensal" onPress={() => scroll.current?.scrollTo({ y: Math.max(0, calendarOffset.current - 12), animated: false })} style={s.todayButton}><Text style={s.todayText}>Ver mês</Text></Pressable></View>
      <Text style={s.caption}>{formatDate(week[0])} a {formatDate(week[6])}</Text>
      <View style={s.weekLabels}>{week.map(date => <Text key={date} style={s.weekLabel}>{weekdayLabels[(localDate(date).getDay() + 6) % 7]}</Text>)}</View>
      <View style={s.weekRow}>{week.map(date => <View key={date} style={s.weekColumn}><Day date={date} today={today} status={dayStatus(date, today, byDate.get(date))} selected={selected === date} weekly onPress={() => select(date)} /></View>)}</View>
      <View style={s.weekFooter}><Text style={s.support}>Sua próxima atividade conta.</Text><Pressable accessibilityRole="button" accessibilityLabel="Adicionar uma atividade" onPress={() => router.push('/activity')} style={s.add}><Icon name="plus" color={colors.background} size={23} /></Pressable></View>
    </View>
    <View style={s.calendarCard} onLayout={event => { calendarOffset.current = event.nativeEvent.layout.y; }}>
      <View style={s.sectionRow}><Text style={s.sectionTitle}>Seu calendário</Text><Pressable accessibilityRole="button" onPress={() => select(today)} style={s.todayButton}><Text style={s.todayText}>Hoje</Text></Pressable></View>
      <View style={s.monthNavigation}>
        <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" onPress={() => browseMonth(-1)} style={s.monthButton}><Icon name="back" size={20} color={colors.text} /></Pressable>
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={s.monthTitle}>{monthLabel}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" accessibilityState={{ disabled: month >= currentMonth }} disabled={month >= currentMonth} onPress={() => browseMonth(1)} style={[s.monthButton, month >= currentMonth && s.future]}><View style={s.forward}><Icon name="back" size={20} color={colors.text} /></View></Pressable>
      </View>
      <View style={s.weekLabels}>{weekdayLabels.map((label, index) => <Text key={index} style={s.weekLabel}>{label}</Text>)}</View>
      <View style={s.grid}>{cells.map((date, index) => <View key={date ?? `blank-${index}`} style={s.gridCell}>{date && <Day date={date} today={today} status={dayStatus(date, today, byDate.get(date))} selected={selected === date} onPress={() => select(date)} />}</View>)}</View>
      <View style={s.legend}><View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: colors.lime }]} /><Text style={s.legendText}>Meta alcançada</Text></View><View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: colors.primary }]} /><Text style={s.legendText}>Em progresso</Text></View></View>
      <Text style={s.monthSummary}>{completedInMonth(month, today, records)} dias com meta alcançada neste mês</Text>
    </View>
    <View style={s.detailCard} accessibilityLiveRegion="polite">
      <View style={s.sectionRow}><Text style={s.detailDate}>{formatDate(selected)}</Text>{selected === today && <Text style={s.todayTag}>HOJE</Text>}</View>
      {daily && record ? <>
        <Text style={s.detailStatus}>{statusLabels[dayStatus(selected, today, record)]}</Text>
        <Text style={s.detailValue}>{daily.total}<Text style={s.detailUnit}> / {record.goal} EV</Text></Text>
        <View accessible accessibilityLabel={`${Math.round(daily.progress)}% da meta de EV`} style={s.track}><View style={{ width: `${daily.greenProgress}%`, backgroundColor: colors.lime }} /><View style={{ width: `${daily.blueProgress}%`, backgroundColor: colors.primary }} /></View>
        <View style={s.energyRow}><View style={s.energyItem}><Icon name="activity" color={colors.lime} size={20} /><Text style={s.energyText}>{record.green} EV · física</Text></View><View style={s.energyItem}><Icon name="book" color={colors.primary} size={20} /><Text style={s.energyText}>{record.blue} EV · mental</Text></View></View>
        <Text style={s.support}>{daily.complete ? 'Meta do dia alcançada. As duas cores somam para o mesmo objetivo.' : selected === today ? `Faltam ${daily.remaining} EV. Qualquer uma das duas energias pode completar sua meta.` : 'Cada contribuição faz parte da jornada, mesmo nos dias em que a meta não foi alcançada.'}</Text>
        {selected === today && <Button title="Adicionar atividade" onPress={() => router.push('/activity')} />}
      </> : <><Text style={s.emptyTitle}>Sem histórico de EV neste dia</Text><Text style={s.support}>Não há registros para esta data.</Text></>}
    </View>
    {!apiEnabled && <Text style={s.footnote}>Histórico com dados de exemplo.</Text>}
  </Flow>;
}

const s = StyleSheet.create({
  previewTag: { color: colors.muted, fontFamily: 'Montserrat_600SemiBold', fontSize: 9, letterSpacing: 1.5 }, progressDot: { backgroundColor: colors.primary, height: 8, width: 8, borderRadius: 4 },
  intro: { fontFamily: 'Montserrat_400Regular', color: colors.muted, fontSize: 14, lineHeight: 22 },
  streakCard: { borderRadius: 24, borderWidth: 1, borderColor: '#28683E', backgroundColor: '#0A403F', padding: 22, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, iconBadge: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#164D3F', alignItems: 'center', justifyContent: 'center' }, eyebrow: { fontFamily: 'Montserrat_600SemiBold', color: colors.lime, fontSize: 9, letterSpacing: 1.1, flexShrink: 1 },
  streakValue: { fontFamily: 'Montserrat_700Bold', color: colors.lime, fontSize: 54, letterSpacing: -2 }, streakUnit: { fontFamily: 'Montserrat_600SemiBold', fontSize: 23, letterSpacing: 0 }, streakDescription: { fontFamily: 'Montserrat_600SemiBold', color: colors.text, fontSize: 14, lineHeight: 21 },
  support: { fontFamily: 'Montserrat_400Regular', color: '#ADCAD8', fontSize: 12, lineHeight: 19, flexShrink: 1 },
  weekCard: { borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 18, gap: 12 }, sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, sectionTitle: { fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: colors.text, flexShrink: 1 }, caption: { fontFamily: 'Montserrat_400Regular', fontSize: 11, lineHeight: 17, color: colors.muted },
  weekLabels: { flexDirection: 'row' }, weekLabel: { width: `${100 / 7}%`, textAlign: 'center', fontFamily: 'Montserrat_500Medium', fontSize: 10, color: colors.muted }, weekRow: { flexDirection: 'row' }, weekColumn: { flex: 1 }, dayCell: { alignItems: 'center', justifyContent: 'center', minHeight: 53, width: '100%' }, selection: { borderWidth: 1, borderColor: 'transparent', borderRadius: 22, padding: 3 }, selected: { borderColor: '#E2F1F8' }, dayCircle: { borderRadius: 20, borderWidth: 1, borderColor: '#326279', alignItems: 'center', justifyContent: 'center' }, complete: { backgroundColor: colors.lime, borderColor: colors.lime }, partial: { backgroundColor: '#0C4F72', borderColor: colors.primary }, todayCircle: { borderWidth: 2 }, dayNumber: { color: colors.text, fontFamily: 'Montserrat_500Medium', fontSize: 12 }, completeNumber: { color: colors.background, fontFamily: 'Montserrat_700Bold' }, dayMark: { height: 13, alignItems: 'center', justifyContent: 'center' }, todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary }, weekDate: { color: colors.muted, fontFamily: 'Montserrat_500Medium', fontSize: 8 }, future: { opacity: 0.3 }, pressed: { opacity: 0.65 },
  weekFooter: { borderTopWidth: 1, borderColor: '#19536C', paddingTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, add: { height: 44, width: 44, borderRadius: 22, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  calendarCard: { borderRadius: 24, backgroundColor: colors.surface, padding: 18, gap: 12 }, todayButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }, todayText: { color: colors.primary, fontFamily: 'Montserrat_600SemiBold', fontSize: 12 }, monthNavigation: { flexDirection: 'row', alignItems: 'center', gap: 4 }, monthButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, monthTitle: { flex: 1, textAlign: 'center', color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 13, textTransform: 'capitalize' }, forward: { transform: [{ rotate: '180deg' }] }, grid: { flexDirection: 'row', flexWrap: 'wrap' }, gridCell: { width: `${100 / 7}%`, minHeight: 53 }, legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 8, borderTopWidth: 1, borderColor: '#19536C' }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 }, legendDot: { width: 6, height: 6, borderRadius: 3 }, legendText: { color: '#B9D0DD', fontFamily: 'Montserrat_400Regular', fontSize: 10 }, monthSummary: { fontFamily: 'Montserrat_500Medium', color: '#B9D0DD', fontSize: 11, lineHeight: 18 },
  detailCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 24, padding: 22, gap: 16 }, detailDate: { flex: 1, color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 17 }, todayTag: { fontFamily: 'Montserrat_600SemiBold', fontSize: 9, color: colors.lime, letterSpacing: 1.2 }, detailStatus: { fontFamily: 'Montserrat_500Medium', fontSize: 12, color: '#B9D0DD' }, detailValue: { fontFamily: 'Montserrat_700Bold', fontSize: 36, color: colors.text }, detailUnit: { fontFamily: 'Montserrat_500Medium', fontSize: 16, color: colors.muted }, track: { height: 6, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', flexDirection: 'row' }, energyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 }, energyItem: { flexDirection: 'row', alignItems: 'center', gap: 7 }, energyText: { fontFamily: 'Montserrat_500Medium', color: colors.text, fontSize: 11 }, emptyTitle: { fontFamily: 'Montserrat_500Medium', fontSize: 14, color: colors.text }, footnote: { fontFamily: 'Montserrat_400Regular', fontSize: 10, color: colors.muted, lineHeight: 17 },
});
