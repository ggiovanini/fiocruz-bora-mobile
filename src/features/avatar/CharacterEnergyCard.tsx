import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/design/tokens';
import type { CharacterEnergy } from '@/api/contracts';

const number = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const date = (value: string) => value.split('-').reverse().join('/');
export function CharacterEnergyCard({ energy, illustrative = false }: { energy?: CharacterEnergy; illustrative?: boolean }) {
  return <View style={s.card}>
    <Text style={s.title}>Bean · últimos 7 dias</Text>
    {!energy ? <Text style={s.copy}>Resumo indisponível. Atualize sua jornada.</Text> : <>
      {illustrative && <Text style={s.copy}>Exemplo ilustrativo</Text>}
      <Text style={s.copy}>{date(energy.period.starts_on)} a {date(energy.period.ends_on)}</Text>
      {(['physical', 'intellectual'] as const).map(key => {
        const channel = energy[key], label = key === 'physical' ? 'Física' : 'Mental';
        const color = key === 'physical' ? colors.lime : colors.primary;
        return <View key={key} style={s.channel}>
          <View style={s.row}><Text style={[s.label, { color }]}>{label}</Text><Text style={s.label}>{number(channel.intensity_percent)}% de intensidade visual</Text></View>
          <View accessible accessibilityRole="progressbar" accessibilityLabel={`Intensidade visual: atividade ${label}`} accessibilityValue={{ min: 0, max: 100, now: channel.intensity_percent }} style={s.track}><View style={[s.fill, { backgroundColor: color, width: `${channel.intensity_percent}%` }]}/></View>
          <Text style={s.copy}>{number(channel.earned_ev)} de {number(channel.full_color_ev)} EV para intensidade máxima</Text>
          <Text style={s.small}>Meta completa: {number(channel.weekly_goal_ev)} EV · {number(channel.goal_percent)}% cumprida</Text>
        </View>;
      })}
      <Text style={s.copy}>A aparência do Bean acompanha suas atividades dos últimos 7 dias.</Text>
      <Text style={s.small}>Cada tipo tem sua contribuição visual. Isso não muda a meta diária de EV.</Text>
    </>}
  </View>;
}
const s = StyleSheet.create({ card: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, gap: 12, marginTop: 24 }, title: { color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 15 }, copy: { color: colors.muted, fontSize: 12, lineHeight: 19 }, small: { color: colors.muted, fontSize: 10, lineHeight: 16 }, channel: { gap: 7, paddingVertical: 7 }, row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, label: { color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 12 }, track: { height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 5 }, swatches: { flexDirection: 'row', gap: 8 }, swatch: { width: 38, height: 28, borderRadius: 7, borderWidth: 1, borderColor: colors.muted } });
