import { apiEnabled } from '@/api/session';
import { useMock } from '@/mocks/MockProvider';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import type { EnergySummary } from '@/api/contracts';
import { Sheet } from '@/ui/Sheet';
import { Flow, Button, Copy } from '@/ui/Flow';
import { Chip } from '@/components/ActivityUI';
import { colors } from '@/design/tokens';
import { Icon } from '@/design/Icon';
import { levelThreshold, PREVIEW_LEVEL_RULE, projectInactivity, replenish } from './progression';
import { useLevelPreview } from './useLevelPreview';
const format = (value: number) => value.toLocaleString('pt-BR');

function LevelBadge({ level, progress, maximum = false }: { level: number; progress: number; maximum?: boolean }) {
  const length = 2 * Math.PI * 76;
  return <View style={s.badge} accessible accessibilityLabel={maximum ? `Nível ${level}. Maior nível disponível.` : `Nível ${level}. ${Math.round(progress)}% da faixa até o próximo nível.`}>
    <Svg width={144} height={144} viewBox="0 0 180 180" accessible={false}>
      <Defs><LinearGradient id="level-ring" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={colors.lime} /><Stop offset="1" stopColor={colors.primary} /></LinearGradient></Defs>
      <Circle cx={90} cy={90} r={67} fill="#0A4358" />
      <Circle cx={90} cy={90} r={76} fill="none" stroke="#1B5064" strokeWidth={5} />
      {progress > 0 && <Circle cx={90} cy={90} r={76} fill="none" stroke="url(#level-ring)" strokeWidth={5} strokeDasharray={`${length * progress / 100} ${length}`} rotation={-90} origin="90,90" strokeLinecap="round" />}
    </Svg>
    <View style={s.badgeText}><Text style={s.badgeLabel}>NÍVEL</Text><Text style={s.badgeValue}>{level}</Text><View style={s.badgeMark}><Icon name="leaf" color={colors.lime} size={17} /></View></View>
  </View>;
}

type Level = NonNullable<EnergySummary['vitality']['level']>;
function LevelOverview({ vitality, level }: { vitality: number; level: Level | null }) {
  return <View style={s.hero}>
    <View style={s.heroRow}>
      {level && <LevelBadge level={level.number} progress={level.progress_percent} maximum={!level.next}/>}
      <View style={s.vitality}><Text style={s.reserveLabel}>VITALIDADE</Text><Text style={s.reserveValue}>{format(vitality)}<Text style={s.unit}> PV</Text></Text></View>
    </View>
    {level ? level.name !== `Nível ${level.number}` && <Text style={s.heroTitle}>{level.name}</Text> : <Copy muted>Os níveis ainda não foram configurados.</Copy>}
    {level?.next ? <View style={s.milestone}>
      <Text style={s.eyebrow}>PRÓXIMO MARCO</Text>
      <Text style={s.sectionTitle}>Nível {level.next.number}{level.next.name !== `Nível ${level.next.number}` ? ` · ${level.next.name}` : ''}</Text>
      <Text style={s.remaining}>Faltam <Text style={s.highlight}>{format(level.remaining_pv)} PV</Text></Text>
      <View style={s.milestoneTrack} accessibilityRole="progressbar" accessibilityLabel="Progresso até o próximo nível" accessibilityValue={{min:0,max:100,now:level.progress_percent}}><View style={[s.milestoneFill,{width:`${level.progress_percent}%`}]}/></View>
      <View style={s.range}><Text style={s.rangeText}>{format(level.minimum_pv)} PV</Text><Text style={s.rangeText}>{format(level.next.minimum_pv)} PV</Text></View>
    </View> : level && <Text style={s.remaining}>Maior nível disponível</Text>}
  </View>;
}
function HowItWorksButton({ onPress }: { onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="Como funciona o meu nível" onPress={onPress} style={s.simulationLink}><Icon name="book" size={19}/><Text style={s.simulationLinkText}>Como funciona</Text><Icon name="arrow" size={17}/></Pressable>;
}
function EarnedEnergy({ value }: { value: number }) {
  return <View style={s.card}><Text style={s.reserveLabel}>EV ACUMULADOS</Text><Text style={s.balanceValue}>{format(value)}<Text style={s.unit}> EV</Text></Text><Text style={s.body}>Seu histórico de conquistas é preservado, mesmo quando a Vitalidade diminui.</Text></View>;
}

function PreviewLevels() {
  const router = useRouter();
  const current = useLevelPreview();
  const [about, setAbout] = useState(false);
  const [days, setDays] = useState(7);
  const [protectedRest, setProtectedRest] = useState(false);
  const [green, setGreen] = useState(0);
  const [blue, setBlue] = useState(0);
  const projection = projectInactivity({ vitality: current.vitality, totalEarnedEV: current.totalEarnedEV, inactiveDays: current.inactiveDays, days, protectedRest });
  const result = green + blue > 0 ? replenish(projection, green, blue) : projection;
  const levels = Array.from({ length: 4 }, (_, index) => Math.max(1, current.level - 1) + index);
  const simulated = days > 0 || green + blue > 0 || protectedRest;
  function chooseDays(value: number) { setDays(value); setGreen(0); setBlue(0); }
  const level: Level = {number:current.level,name:`Nível ${current.level}`,minimum_pv:current.floor,progress_percent:current.progress,remaining_pv:current.remaining,maximum_reached:false,next:{number:current.level+1,name:`Nível ${current.level+1}`,minimum_pv:current.next}};
  return <Flow title="Meu nível" centered footer={<Button title="Registrar atividade" onPress={()=>router.push('/activity')}/>}>
    <Text style={s.previewLabel}>DEMONSTRAÇÃO</Text>
    <LevelOverview vitality={current.vitality} level={level}/>
    <HowItWorksButton onPress={()=>setAbout(true)}/>
    <Sheet visible={about} title="Como funciona" onClose={()=>setAbout(false)}>
    <Text style={s.body}>A Vitalidade (PV) determina seu nível. Atividades físicas e mentais contribuem para a evolução.</Text>
    <EarnedEnergy value={current.totalEarnedEV}/>
    <View style={s.card}>
      <View style={s.sectionRow}><Icon name="clock" color={colors.primary} size={22} /><Text style={s.sectionTitle}>Tempo para retomar</Text></View>
      <Text style={s.body}>Os primeiros {PREVIEW_LEVEL_RULE.graceDays} dias completos sem atividades preservam a Vitalidade. Nesta simulação, o desgaste começa no 8º dia.</Text>
      <View style={s.ruleRow}><View style={s.ruleIcon}><Icon name="leaf" color={colors.lime} size={19} /></View><Text style={s.ruleText}>Cada EV conquistado soma ao seu histórico e repõe 1 ponto de Vitalidade (PV), mesmo sem completar a meta diária.</Text></View>
      <View style={s.ruleRow}><View style={s.ruleIcon}><Icon name="target" color={colors.primary} size={19} /></View><Text style={s.ruleText}>Uma atividade elegível reinicia a inatividade. Só a Vitalidade abaixo da faixa reduz o nível; seus EV acumulados não diminuem.</Text></View>
    </View>
    <View style={s.card}>
      <Text style={s.eyebrow}>ENTENDA SUA EVOLUÇÃO</Text>
      <Text style={s.sectionTitle}>Seus próximos marcos</Text>
      {levels.map(level => {
        const active = level === current.level;
        const past = level < current.level;
        return <View key={level} style={s.levelRow}>
          <View style={[s.levelDot, active && s.levelDotActive]}>{past ? <Icon name="check" size={18} color={colors.lime} /> : <Text style={[s.levelDotNumber, active && { color: colors.background }]}>{level}</Text>}</View>
          <View style={s.levelText}><Text style={s.levelName}>Nível {level}</Text><Text style={s.levelAmount}>A partir de {format(levelThreshold(level))} PV de Vitalidade</Text></View>
          {active && <Text style={s.currentTag}>ATUAL</Text>}
        </View>;
      })}
      <Text style={s.caption}>Faixas de exemplo. Os intervalos aumentam nos níveis mais altos.</Text>
    </View>
    <View style={[s.card, s.simulation]}>
      <View style={s.sectionRow}><Icon name="bolt" color={colors.lime} size={22} /><Text style={s.sectionTitle}>Experimente a evolução</Text></View>
      <Text style={s.body}>O que acontece se ficar um período sem atividades? Depois, experimente repor energia.</Text>
      <Text style={s.inputLabel}>Dias futuros sem atividades</Text>
      <View style={s.chips}>{[0, 7, 8, 14, 30].map(value => <Chip key={value} label={value === 0 ? 'Agora' : `${value} dias`} selected={days === value} onPress={() => chooseDays(value)} />)}</View>
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: protectedRest }} onPress={() => setProtectedRest(value => !value)} style={s.restSwitch}>
        <View style={s.restText}><Text style={s.restTitle}>Simular pausa protegida</Text><Text style={s.caption}>Sem desgaste durante o período escolhido.</Text></View><View style={[s.switchTrack, protectedRest && s.switchOn]}><View style={[s.switchThumb, protectedRest && s.thumbOn]} /></View>
      </Pressable>
      <View style={s.outcome} accessibilityLiveRegion="polite">
        <Text style={s.eyebrow}>{simulated ? 'RESULTADO DO CENÁRIO' : 'ESTADO ATUAL'}</Text>
        <View style={s.outcomeTop}><Text style={s.outcomeLevel}>Nível {result.level}</Text><Text style={s.outcomeValue}>{format(result.vitality)} PV</Text></View>
        <Text style={s.body}>{protectedRest ? 'Vitalidade preservada pela pausa protegida.' : projection.chargeableDays === 0 ? 'Sem desgaste: o período está dentro dos sete dias de proteção inicial.' : `${projection.chargeableDays} ${projection.chargeableDays === 1 ? 'dia' : 'dias'} com desgaste de ${PREVIEW_LEVEL_RULE.dailyDecay} PV por dia. O desgaste afeta apenas a Vitalidade.`}</Text>
        <View style={s.equation}><Text style={s.equationText}>{format(current.vitality)} PV iniciais</Text><Text style={s.loss}>−{format(projection.loss)} PV desgaste</Text><Text style={s.gain}>+{format(green + blue)} PV reposição</Text></View>
        <Text style={s.preservedEV}>EV acumulados: {format(result.totalEarnedEV)} EV. Não sofrem desgaste.</Text>
        <Text style={s.resultNote}>{green + blue > 0 && result.level > projection.level ? `A reposição leva do nível ${projection.level} para o ${result.level}.` : result.level < current.level ? `Neste cenário, a Vitalidade cai do nível ${current.level} para o ${result.level}.` : result.level > current.level ? `Com a reposição, a Vitalidade chega ao nível ${result.level}.` : `A Vitalidade mantém o nível ${current.level}.`}</Text>
        {green + blue > 0 && <Text style={s.caption}>Reposição ao final do período: {green} EV físicos + {blue} EV mentais. A contagem de inatividade volta a zero.</Text>}
      </View>
      <Text style={s.inputLabel}>Repor no final desse período</Text>
      <View style={s.energyButtons}>
        <Pressable accessibilityRole="button" onPress={() => setGreen(value => value + 50)} style={s.energyButton}><Icon name="activity" size={21} color={colors.lime} /><Text style={s.energyButtonText}>+50 EV físicos</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setBlue(value => value + 50)} style={s.energyButton}><Icon name="book" size={21} color={colors.primary} /><Text style={s.energyButtonText}>+50 EV mentais</Text></Pressable>
      </View>
      <Button title="Reiniciar cenário" secondary onPress={() => { setDays(7); setProtectedRest(false); setGreen(0); setBlue(0); }} />
      <Text style={s.caption}>O cenário não altera sua home ou seus registros. O desgaste é de 20 PV/dia neste exemplo; as faixas também são ilustrativas.</Text>
    </View>
    <Button secondary title="Ver minha constância" onPress={()=>{setAbout(false);router.push('/constancy');}}/>
    <Text style={s.footnote}>Demonstração com valores e faixas ilustrativos. O simulador não altera sua jornada. A pausa protegida é apenas um cenário de exemplo.</Text>
    </Sheet>
  </Flow>;
}

const s = StyleSheet.create({
  heroRow: { width:'100%',flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'center',gap:20 }, vitality: { alignItems:'center',gap:8,flexShrink:1 }, milestone: { width:'100%',gap:10,alignItems:'center',borderTopWidth:1,borderTopColor:colors.border,paddingTop:16 },
  simulationLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 44 }, simulationLinkText: { color: colors.primary, fontFamily: 'Montserrat_600SemiBold', fontSize: 12 },
  balanceValue: { fontFamily: 'Montserrat_700Bold', fontSize: 29, color: colors.text, textAlign: 'center' }, preservedEV: { color: colors.primary, fontFamily: 'Montserrat_600SemiBold', fontSize: 12, lineHeight: 19 },
  previewLabel: { fontFamily: 'Montserrat_600SemiBold', color: colors.muted, fontSize: 9, letterSpacing: 1.4 },
  hero: { borderWidth: 1, borderColor: '#21586C', backgroundColor: colors.surface, padding: 20, borderRadius: 24, alignItems: 'center', gap: 14 }, badge: { width: 144, height: 144, alignItems: 'center', justifyContent: 'center' }, badgeText: { position: 'absolute', alignItems: 'center', gap: 3 }, badgeLabel: { fontFamily: 'Montserrat_600SemiBold', color: '#B8D0DE', fontSize: 10, letterSpacing: 2 }, badgeValue: { fontFamily: 'Montserrat_700Bold', color: colors.text, fontSize: 49, lineHeight: 56, letterSpacing: -2 }, badgeMark: { marginTop: 3 }, heroTitle: { color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 16, textAlign: 'center' }, reserveLabel: { fontFamily: 'Montserrat_500Medium', color: colors.muted, fontSize: 9, letterSpacing: 1.2, marginTop: 6, textAlign: 'center' }, reserveValue: { fontFamily: 'Montserrat_700Bold', fontSize: 41, color: colors.text, letterSpacing: -1 }, unit: { fontSize: 15, letterSpacing: 0, color: colors.muted }, remaining: { color: '#BCD4E0', fontFamily: 'Montserrat_400Regular', fontSize: 12, lineHeight: 20, textAlign: 'center' }, highlight: { color: colors.lime, fontFamily: 'Montserrat_600SemiBold' }, milestoneTrack: { width: '100%', height: 5, borderRadius: 3, backgroundColor: '#1B5064', overflow: 'hidden' }, milestoneFill: { height: '100%', backgroundColor: colors.lime }, range: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }, rangeText: { fontFamily: 'Montserrat_500Medium', fontSize: 9, color: colors.muted }, card: { padding: 22, gap: 16, borderRadius: 24, backgroundColor: colors.surface }, sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, sectionTitle: { fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: colors.text, flexShrink: 1 }, body: { color: '#B9D0DE', fontFamily: 'Montserrat_400Regular', fontSize: 12, lineHeight: 20 }, ruleRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' }, ruleIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B4661', borderRadius: 10 }, ruleText: { flex: 1, color: '#B9D0DE', fontFamily: 'Montserrat_400Regular', fontSize: 12, lineHeight: 20 }, eyebrow: { color: colors.lime, fontFamily: 'Montserrat_600SemiBold', fontSize: 9, letterSpacing: 1.2 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }, levelDot: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#34667B', alignItems: 'center', justifyContent: 'center' }, levelDotActive: { backgroundColor: colors.lime, borderColor: colors.lime }, levelDotNumber: { color: colors.muted, fontFamily: 'Montserrat_600SemiBold', fontSize: 15 }, levelText: { flex: 1, gap: 5 }, levelName: { color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 14 }, levelAmount: { color: colors.muted, fontFamily: 'Montserrat_400Regular', fontSize: 11, lineHeight: 17 }, currentTag: { color: colors.lime, fontFamily: 'Montserrat_600SemiBold', fontSize: 8, letterSpacing: 1 }, caption: { color: colors.muted, fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 17 },
  simulation: { borderWidth: 1, borderColor: '#235E76' }, inputLabel: { fontFamily: 'Montserrat_500Medium', fontSize: 12, color: colors.text }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, restSwitch: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }, restText: { flex: 1, gap: 5 }, restTitle: { fontFamily: 'Montserrat_500Medium', color: colors.text, fontSize: 12 }, switchTrack: { width: 42, height: 25, borderRadius: 14, padding: 3, backgroundColor: '#2A5268', alignItems: 'flex-start' }, switchOn: { backgroundColor: '#316B39' }, switchThumb: { width: 19, height: 19, borderRadius: 10, backgroundColor: '#9EBCCA' }, thumbOn: { backgroundColor: colors.lime, alignSelf: 'flex-end' }, outcome: { borderRadius: 18, padding: 16, gap: 13, backgroundColor: colors.background }, outcomeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }, outcomeLevel: { fontFamily: 'Montserrat_600SemiBold', color: colors.text, fontSize: 21 }, outcomeValue: { fontFamily: 'Montserrat_600SemiBold', color: colors.lime, fontSize: 17 }, equation: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, equationText: { color: colors.muted, fontFamily: 'Montserrat_500Medium', fontSize: 10 }, loss: { color: '#FFCD8E', fontFamily: 'Montserrat_500Medium', fontSize: 10 }, gain: { color: colors.lime, fontFamily: 'Montserrat_500Medium', fontSize: 10 }, resultNote: { fontFamily: 'Montserrat_600SemiBold', color: colors.text, fontSize: 12, lineHeight: 19 }, energyButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, energyButton: { minHeight: 48, flexGrow: 1, borderWidth: 1, borderColor: '#31667C', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 8 }, energyButtonText: { fontFamily: 'Montserrat_500Medium', color: colors.text, fontSize: 11 }, footnote: { color: colors.muted, fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 17 },
});

function ConnectedLevels() {
  const router = useRouter();
  const { api } = useMock();
  const [about,setAbout] = useState(false);
  const summary = api.data.energy;
  const level = summary?.vitality.level ?? null;
  return <Flow title="Meu nível" centered footer={<Button title="Registrar atividade" onPress={()=>router.push('/activity')}/>}>
    {summary ? <LevelOverview vitality={summary.vitality.points} level={level}/> : <><Copy muted>{api.busy ? 'Carregando sua evolução…' : 'Não foi possível carregar sua evolução.'}</Copy><Button secondary title="Atualizar" disabled={api.busy} onPress={()=>{void api.refresh().catch(()=>{});}}/></>}
    {summary && <HowItWorksButton onPress={()=>setAbout(true)}/>}
    <Sheet visible={about} title="Como funciona" onClose={()=>setAbout(false)}>
      {summary && <>
        <EarnedEnergy value={summary.lifetime_earned_ev}/>
        <View style={s.card}>
          <View style={s.sectionRow}><Icon name="leaf" color={colors.lime} size={22}/><Text style={s.sectionTitle}>Vitalidade e nível</Text></View>
          <Text style={s.body}>Cada EV conquistado soma 1 PV de Vitalidade. Atividades físicas e mentais contribuem para a mesma evolução.</Text>
          <Text style={s.body}>Seu nível acompanha a faixa da Vitalidade atual. Ele pode subir ou cair ao cruzar os limites em PV. Os EV acumulados não diminuem com o desgaste.</Text>
          {level && <Text style={s.body}>{level.next ? `O nível ${level.number} começa em ${format(level.minimum_pv)} PV. O próximo marco é ${level.next.name}, com ${format(level.next.minimum_pv)} PV.` : 'Você está no maior nível configurado. Sua Vitalidade continua acumulando.'}</Text>}
        </View>
        <View style={s.card}>
          <View style={s.sectionRow}><Icon name="clock" size={22}/><Text style={s.sectionTitle}>Tempo para retomar</Text></View>
          <Text style={s.body}>Os primeiros sete dias completos sem atividades não têm desgaste. A partir do oitavo dia, o desgaste diário é de {summary.vitality.daily_decay_percent}% da meta vigente: {format(summary.vitality.daily_decay_pv)} PV por dia para a meta atual.</Text>
          <Text style={s.body}>O desconto incide sobre a meta, não sobre seu saldo. A Vitalidade nunca fica abaixo de zero.</Text>
          <Text style={s.body}>Uma atividade aceita reinicia a contagem de inatividade, mesmo sem completar a meta diária. Metas anteriores e EV acumulados são preservados.</Text>
        </View>
      </>}
    </Sheet>
  </Flow>;
}
export default function Levels() { return apiEnabled ? <ConnectedLevels /> : <PreviewLevels />; }
