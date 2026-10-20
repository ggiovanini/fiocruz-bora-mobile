import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { Button, Card, Copy, Flow } from '@/ui/Flow';
import { colors } from '@/design/tokens';
import { EnergyAvatar } from './EnergyAvatar';
import type { Motion } from './AvatarScene';
import { dailyEnergy } from './energy';
import { useEnergyPreview } from './EnergyPreview';

export default function AvatarDemo() {
  const [motion, setMotion] = useState<Motion>('idle');
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const { energy, setEnergy, goal, setGoal } = useEnergyPreview();
  const daily = dailyEnergy(energy.green, energy.blue, goal);
  function addEnergy(source: 'green' | 'blue') {
    const next = { ...energy, [source]: energy[source] + 10 };
    setEnergy(next);
    if (dailyEnergy(next.green, next.blue, goal).complete) setMotion('celebrate');
  }
  function changeGoal(value: number) {
    setGoal(value);
    setMotion(dailyEnergy(energy.green, energy.blue, value).complete ? 'celebrate' : 'idle');
  }
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted && value) setPlaying(false); });
    const reduce = AccessibilityInfo.addEventListener('reduceMotionChanged', value => { if (value) setPlaying(false); });
    return () => { mounted = false; reduce.remove(); };
  }, []);
  return <Flow title="Seu avatar em movimento">
    <Copy muted>Prova de conceito · sua energia física e intelectual, juntas.</Copy>
    <View style={styles.viewport} accessibilityLabel={`Avatar de energia em 3D. Energia verde: ${energy.green} EV. Energia azul: ${energy.blue} EV. Total: ${daily.total} de ${goal} EV hoje.`}>
      <EnergyAvatar motion={motion} playing={playing} respectReducedMotion={false} speed={speed} greenProgress={daily.greenProgress} blueProgress={daily.blueProgress} height={420} />
    </View>
    <Card title={`Energia Vital de hoje · ${daily.total} / ${goal} EV`}>
      <Copy>{Math.round(daily.progress)}% da meta diária · {daily.complete ? 'Meta atingida!' : `Faltam ${daily.remaining} EV`}</Copy>
      <View style={styles.energyRow}><View style={[styles.dot, { backgroundColor: colors.lime }]} /><Copy>Física · energia verde · {energy.green} EV</Copy></View>
      <View style={styles.energyRow}><View style={[styles.dot, { backgroundColor: colors.primary }]} /><Copy>Intelectual · energia azul · {energy.blue} EV</Copy></View>
      <Copy muted>EV = verde + azul. O arco mostra a contribuição de cada energia para uma única meta. Qualquer combinação conta, inclusive só uma delas.</Copy>
    </Card>
    <Card title="Minha meta diária na simulação">
      {[50, 100, 150].map(value => <Button key={value} title={`${goal === value ? '✓ ' : ''}${value} EV por dia`} secondary={goal !== value} onPress={() => changeGoal(value)} />)}
      <Copy muted>O objetivo é manter a constância diária em EV. As cores mostram as duas contribuições, sem cotas obrigatórias por tipo.</Copy>
    </Card>
    <Card title="Experimentar movimentos">
      {([['idle', 'Respirar'], ['walk', 'Caminhar'], ['celebrate', 'Comemorar']] as const).map(([value, label]) => <Button key={value} title={`${motion === value ? '✓ ' : ''}${label}`} secondary={motion !== value} onPress={() => { setMotion(value); }} />)}
      <Button title={playing ? 'Pausar animação' : 'Reproduzir animação'} secondary onPress={() => setPlaying(!playing)} />
      <Button title={`Velocidade: ${speed}×`} secondary onPress={() => setSpeed(speed === 1 ? 1.5 : speed === 1.5 ? .5 : 1)} />
    </Card>
    <Card title="Simular atividades de hoje">
      <Button title="Atividade física · +10 EV verde" onPress={() => addEnergy('green')} />
      <Button title="Atividade intelectual · +10 EV azul" secondary onPress={() => addEnergy('blue')} />
      <Button title="Reiniciar energias do dia" secondary onPress={() => { setEnergy({ green: 0, blue: 0 }); setMotion('idle'); }} />
      <Copy muted>Dados fictícios desta tela. Cada botão adiciona 10 EV apenas para testar; a conversão de atividades em EV ainda será definida. A prévia é compartilhada com a tela Hoje e reinicia ao sair da sessão.</Copy>
    </Card>
  </Flow>;
}
const styles = StyleSheet.create({ energyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, dot: { width: 12, height: 12, borderRadius: 6 }, viewport: { height: 420, overflow: 'hidden', borderRadius: 24, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border } });
