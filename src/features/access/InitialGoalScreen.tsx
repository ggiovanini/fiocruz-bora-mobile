import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors } from '@/design/tokens';
import { Button, Copy, Flow, Notice } from '@/ui/Flow';

export const initialGoals = [
  { name: 'Iniciante', ev: 30, caption: 'Um passo de cada vez', description: 'Para começar com calma e criar espaço para o cuidado na sua rotina.', image: require('../../../assets/images/bean/bean-wave-v1.png') },
  { name: 'Dia a dia', ev: 60, caption: 'Cuidado que vira hábito', description: 'Para encaixar mais movimento e atividades para a mente no seu dia a dia.', image: require('../../../assets/images/bean/activity-book-v1.png') },
  { name: 'Experiente', ev: 100, caption: 'Um ritmo que já é seu', description: 'Para quem já tem uma rotina de atividades e quer manter a constância.', image: require('../../../assets/images/bean/bean-physical-v1.png') },
] as const;

export default function InitialGoalScreen({ onSelect }: { onSelect: (goal: number) => Promise<void> }) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const pager = useRef<ScrollView>(null);
  const { height } = useWindowDimensions();
  const choice = initialGoals[index];
  function goTo(next: number) {
    if (saving.current) return;
    setIndex(next);
    pager.current?.scrollTo({ x: next * width, animated: true });
  }
  async function confirm() {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try { await onSelect(choice.ev); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível salvar sua meta. Tente novamente.'); }
    finally { saving.current = false; setBusy(false); }
  }
  return <Flow title="Qual é o seu ritmo?" back={false} centered demo={false}
    footer={<><Text style={s.hint}>Sua meta começa a valer hoje. Você pode ajustá-la depois nas configurações.</Text>
      <Button title={`Começar com ${choice.ev} EV por dia`} busy={busy} disabled={busy} onPress={() => { void confirm(); }} /></>}>
    <Copy>Escolha sua meta diária de Energia Vital (EV). Atividades para o corpo e para a mente somam para a mesma meta.</Copy>
    <View style={s.tabs} accessibilityRole="tablist">
      {initialGoals.map((item, i) => <Pressable key={item.ev} accessibilityRole="tab" accessibilityLabel={`${item.name}, ${item.ev} EV por dia`}
        accessibilityState={{ selected: index === i, disabled: busy }} disabled={busy} onPress={() => goTo(i)} style={[s.tab, index === i && s.selectedTab]}>
        <Text style={[s.tabText, index === i && s.selectedText]}>{item.name}</Text>
      </Pressable>)}
    </View>
    <View onLayout={event => { const next = event.nativeEvent.layout.width; setWidth(next); pager.current?.scrollTo({ x: index * next, animated: false }); }}>
      <ScrollView ref={pager} horizontal pagingEnabled scrollEnabled={!busy} showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={event => { if (width) setIndex(Math.max(0, Math.min(2, Math.round(event.nativeEvent.contentOffset.x / width)))); }}>
        {initialGoals.map((item, i) => <View key={item.ev} style={[s.card, { width }]} aria-hidden={index !== i} accessibilityElementsHidden={index !== i} importantForAccessibility={index === i ? 'auto' : 'no-hide-descendants'}>
          <Image source={item.image} style={{ width: '100%', height: height < 720 ? 100 : 150 }} resizeMode="contain" accessible={false} />
          <Text style={s.name}>{item.name}</Text>
          <Text style={s.value}>{item.ev}<Text style={s.unit}> EV por dia</Text></Text>
          <Text style={s.caption}>{item.caption}</Text>
          <Text style={s.description}>{item.description}</Text>
        </View>)}
      </ScrollView>
    </View>
    <Text style={s.hint} accessibilityLiveRegion="polite">{index + 1} de 3 · Deslize ou toque em um ritmo para escolher</Text>
    {!!error && <Notice>{error}</Notice>}
  </Flow>;
}

const s = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 6 },
  tab: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 4 },
  selectedTab: { backgroundColor: colors.lime, borderColor: colors.lime },
  tabText: { color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 11 },
  selectedText: { color: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, alignItems: 'center', gap: 8 },
  name: { color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 20 },
  value: { color: colors.lime, fontFamily: 'Montserrat_700Bold', fontSize: 40 },
  unit: { color: colors.text, fontSize: 14 },
  caption: { color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 14, textAlign: 'center' },
  description: { color: colors.muted, fontFamily: 'Montserrat_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  hint: { color: colors.muted, fontFamily: 'Montserrat_400Regular', fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
