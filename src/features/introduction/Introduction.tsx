import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, ActivityIndicator, BackHandler, Image, Pressable,
  ScrollView, StyleSheet, Text, useWindowDimensions, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '@/design/tokens';
import { Icon } from '@/design/Icon';

const slides = [
  {
    eyebrow: 'CORPO E MENTE EM MOVIMENTO',
    title: 'Seu bem-estar\nganha energia.',
    description: 'Mover o corpo gera energia verde. Aprender e exercitar a mente gera energia azul. Cada atividade é uma forma de cuidar de você.',
  },
  {
    eyebrow: 'ENERGIA VITAL · EV',
    title: 'Duas energias.\nUma só meta.',
    description: 'EV é a soma das energias verde e azul. Você escolhe sua meta diária e pode alcançá-la com atividades físicas, intelectuais ou uma combinação das duas.',
  },
  {
    eyebrow: 'NO SEU RITMO, TODOS OS DIAS',
    title: 'Pequenos passos.\nMais constância.',
    description: 'Registre suas atividades e acompanhe seu progresso. O arco ao redor do personagem mostra quanto falta para a meta de EV do dia.',
  },
];

function GoalIllustration() {
  return <View style={s.goal} accessible accessibilityLabel="Exemplo: 65 EV de uma meta diária de 100 EV, com contribuições das duas energias.">
    <Svg width={228} height={228} viewBox="0 0 228 228" accessible={false}>
      <Circle cx={114} cy={114} r={96} fill="#002B45" fillOpacity={0.8} />
      <Circle cx={114} cy={114} r={96} fill="none" stroke="#16445D" strokeWidth={10} strokeDasharray="452 604" rotation={135} origin="114,114" strokeLinecap="round" />
      <Circle cx={114} cy={114} r={96} fill="none" stroke={colors.lime} strokeWidth={10} strokeDasharray="158 604" rotation={135} origin="114,114" strokeLinecap="round" />
      <Circle cx={114} cy={114} r={96} fill="none" stroke={colors.primary} strokeWidth={10} strokeDasharray="136 604" rotation={233} origin="114,114" strokeLinecap="round" />
    </Svg>
    <View style={s.goalNumber}><Text style={s.goalValue}>65<Text style={s.ev}> EV</Text></Text><Text style={s.goalCaption}>de 100 EV no dia</Text></View>
    <Text style={s.example}>Exemplo de progresso</Text>
  </View>;
}

function RoutineIllustration() {
  return <View style={s.routine} accessible accessibilityLabel="Uma atividade de cada vez, um dia de cada vez.">
    <View style={s.routineTop}><Icon name="leaf" color={colors.lime} size={26} /><Text style={s.routineTitle}>Um dia de cada vez</Text></View>
    <View style={s.days}>
      {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, index) => <View key={index} style={s.day}>
        <Text style={s.dayLabel}>{day}</Text>
        <View style={[s.dayCircle, index < 3 && s.dayComplete, index === 3 && s.dayToday]}>
          {index < 3 ? <Icon name="check" size={19} color={colors.background} /> : index === 3 ? <View style={s.todayDot} /> : null}
        </View>
      </View>)}
    </View>
    <Text style={s.routineCaption}>Sua próxima atividade conta.</Text>
    <View style={s.activityBadge}><Icon name="plus" color={colors.background} size={22} /></View>
  </View>;
}

export default function Introduction({ onFinish, finishLabel = 'Bóra começar' }: { onFinish: () => Promise<void>; finishLabel?: string }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const pending = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const { height } = useWindowDimensions();
  const slide = slides[step];
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    AccessibilityInfo.announceForAccessibility(`Apresentação ${step + 1} de 3. ${slides[step].title.replace('\n', ' ')}`);
    if (step === 0) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { setStep(value => value - 1); return true; });
    return () => subscription.remove();
  }, [step]);
  async function finish() {
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    setError(false);
    try { await onFinish(); }
    catch { setError(true); }
    finally { pending.current = false; setSaving(false); }
  }
  return <View style={s.screen}>
    <StatusBar style="light" />
    <Image source={require('../../../assets/images/welcome-energy.jpg')} style={[StyleSheet.absoluteFill, s.background, step > 0 && s.backgroundDim]} resizeMode="cover" accessible={false} />
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none" accessible={false}>
      <Defs><LinearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={colors.background} stopOpacity={0.12} /><Stop offset="0.43" stopColor={colors.background} stopOpacity={0.08} /><Stop offset="0.62" stopColor={colors.background} stopOpacity={0.96} /><Stop offset="1" stopColor={colors.background} /></LinearGradient></Defs>
      <Rect width="100%" height="100%" fill="url(#shade)" />
    </Svg>
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View style={s.brand} accessible accessibilityLabel="Bóra"><Image source={require('../../../assets/imgs/Logo.png')} style={s.logo} /><Image source={require('../../../assets/imgs/Tipo.png')} style={s.wordmark} /></View>
        {step < 2 ? <Pressable accessibilityRole="button" accessibilityLabel="Pular apresentação" disabled={saving} onPress={() => void finish()} style={s.skip}><Text style={s.skipText}>Pular</Text></Pressable> : <Text style={s.stepCount}>03 / 03</Text>}
      </View>
      <ScrollView ref={scroll} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={[s.hero, { minHeight: Math.min(300, Math.max(200, height * 0.32)) }]}>
          {step === 1 && <GoalIllustration />}
          {step === 2 && <RoutineIllustration />}
        </View>
        <View style={s.copy}>
          <Text style={s.eyebrow}>{slide.eyebrow}</Text>
          <Text accessibilityRole="header" style={s.title}>{slide.title}</Text>
          <Text style={s.description}>{slide.description}</Text>
          {step === 0 && <View style={s.legend}>
            <View style={s.legendItem}><Icon name="activity" color={colors.lime} size={22} /><Text style={s.legendText}>Corpo · verde</Text></View>
            <View style={s.legendItem}><Icon name="book" color={colors.primary} size={22} /><Text style={s.legendText}>Mente · azul</Text></View>
          </View>}
          {step === 1 && <Text style={s.note}>Sem uma cota obrigatória de cada cor.</Text>}
          {step === 2 && <Text style={s.note}>O mesmo personagem. Uma jornada que é sua.</Text>}
        </View>
      </ScrollView>
      <View style={s.footer}>
        <View style={s.progressRow}>
          <View style={s.dots} accessible accessibilityLabel={`Tela ${step + 1} de 3`}>
            {slides.map((_, index) => <View key={index} style={[s.dot, index === step && s.dotActive]} />)}
          </View>
          {step > 0 && <Pressable accessibilityRole="button" onPress={() => setStep(value => value - 1)} disabled={saving} style={s.back}><Text style={s.backText}>Voltar</Text></Pressable>}
        </View>
        {error && <Text accessibilityRole="alert" style={s.error}>Não foi possível salvar a apresentação. Toque em tentar novamente.</Text>}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving, busy: saving }} disabled={saving} onPress={() => error || step === 2 ? void finish() : setStep(value => value + 1)} style={({ pressed }) => [s.next, pressed && s.pressed]}>
          {saving ? <ActivityIndicator color={colors.background} accessibilityLabel="Salvando apresentação" /> : <><Text style={s.nextText}>{error ? 'Tentar novamente' : step === 2 ? finishLabel : 'Continuar'}</Text><Icon name="arrow" color={colors.background} size={23} /></>}
        </Pressable>
      </View>
    </SafeAreaView>
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, background: { width: '100%', height: '100%' }, backgroundDim: { opacity: 0.14 },
  safe: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: { paddingHorizontal: 28, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 64 },
  brand: { flexDirection: 'row', gap: 5, alignItems: 'center' }, logo: { width: 30, height: 34, resizeMode: 'contain' }, wordmark: { width: 76, height: 29, resizeMode: 'contain', tintColor: colors.text },
  skip: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' }, skipText: { color: '#C2D5DF', fontFamily: 'Montserrat_500Medium', fontSize: 14 }, stepCount: { color: colors.muted, fontFamily: 'Montserrat_500Medium', fontSize: 12 },
  scroll: { flexGrow: 1, paddingHorizontal: 28 }, hero: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 12 },
  copy: { paddingTop: 12, paddingBottom: 14 }, eyebrow: { color: colors.lime, fontSize: 10, letterSpacing: 1.6, fontFamily: 'Montserrat_700Bold', marginBottom: 14 },
  title: { fontFamily: 'Montserrat_700Bold', fontSize: 31, lineHeight: 38, letterSpacing: -1, color: colors.text, marginBottom: 14 },
  description: { fontFamily: 'Montserrat_400Regular', fontSize: 15, lineHeight: 24, color: '#C2D5DF' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 20 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 }, legendText: { color: colors.text, fontSize: 12, fontFamily: 'Montserrat_500Medium' },
  note: { color: '#AFC9D7', fontSize: 12, lineHeight: 19, fontFamily: 'Montserrat_500Medium', marginTop: 16 },
  footer: { paddingHorizontal: 28, paddingBottom: 16, paddingTop: 4 }, progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44, marginBottom: 8 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 7 }, dot: { width: 6, height: 6, borderRadius: 4, backgroundColor: '#376078' }, dotActive: { width: 28, backgroundColor: colors.lime },
  back: { minHeight: 44, justifyContent: 'center', paddingLeft: 18 }, backText: { color: '#C2D5DF', fontFamily: 'Montserrat_500Medium', fontSize: 13 },
  next: { minHeight: 56, borderRadius: 28, paddingHorizontal: 24, paddingVertical: 14, backgroundColor: colors.lime, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, nextText: { color: colors.background, fontFamily: 'Montserrat_700Bold', fontSize: 16 }, pressed: { opacity: 0.8 }, error: { color: '#FFD5B8', fontFamily: 'Montserrat_500Medium', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  goal: { alignItems: 'center', justifyContent: 'center' }, goalNumber: { position: 'absolute', top: 79, alignItems: 'center' }, goalValue: { color: colors.text, fontFamily: 'Montserrat_700Bold', fontSize: 48, letterSpacing: -2 }, ev: { fontSize: 18, letterSpacing: 0, color: colors.lime }, goalCaption: { color: '#B8D0DE', fontFamily: 'Montserrat_500Medium', fontSize: 12 }, example: { color: colors.muted, fontFamily: 'Montserrat_500Medium', fontSize: 11, marginTop: -12 },
  routine: { width: '100%', maxWidth: 340, borderRadius: 24, borderWidth: 1, borderColor: '#246079', backgroundColor: '#073B59', padding: 22, paddingBottom: 40, marginBottom: 16 }, routineTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }, routineTitle: { fontFamily: 'Montserrat_600SemiBold', fontSize: 15, color: colors.text, flexShrink: 1 }, days: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 }, day: { alignItems: 'center', gap: 9 }, dayLabel: { fontFamily: 'Montserrat_500Medium', fontSize: 10, color: '#AFC9D7' }, dayCircle: { width: 29, height: 29, borderRadius: 15, borderWidth: 1, borderColor: '#39718A', alignItems: 'center', justifyContent: 'center' }, dayComplete: { backgroundColor: colors.lime, borderColor: colors.lime }, dayToday: { borderColor: colors.primary }, todayDot: { backgroundColor: colors.primary, width: 9, height: 9, borderRadius: 5 }, routineCaption: { color: '#C2D5DF', fontFamily: 'Montserrat_400Regular', fontSize: 12, lineHeight: 18, marginTop: 20 }, activityBadge: { position: 'absolute', bottom: -22, right: 22, width: 46, height: 46, borderRadius: 23, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.background },
});
