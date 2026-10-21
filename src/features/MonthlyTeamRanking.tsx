import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { usePagedResource } from '@/api/usePagedResource';
import { Button, Card, Copy, Flow, Notice } from '@/ui/Flow';
import { Chip, activityStyles } from '@/components/ActivityUI';
import { colors } from '@/design/tokens';
import { Icon } from '@/design/Icon';
type Row = { id: string; name: string; position: number; score: number; is_my_team: boolean; participant_count: number };
type Metadata = { period: { month: string; starts_on: string; ends_on: string; timezone: string; status: string }; calculated_at: string | null; minimum_participants: number };
const date = (value: string) => value.split('-').reverse().join('/');
export default function MonthlyTeamRanking() {
  const router = useRouter();
  const [about, setAbout] = useState(false);
  const { items, metadata, busy, error, more, loadMore, refresh } = usePagedResource<Row, Metadata>('/rankings/teams/monthly');
  return <Flow title="Juntos, vamos mais longe." back={false}>
    <Copy>Ranking geral mensal de equipes</Copy>
    {!!metadata && <Copy muted>{date(metadata.period.starts_on)} a {date(metadata.period.ends_on)} · Horário de Brasília</Copy>}
    <Button secondary title="Conhecer e participar de equipes" onPress={() => router.push('/teams')}/>
    <View style={activityStyles.chips}><Chip label="Classificação" selected={!about} onPress={() => setAbout(false)}/><Chip label="Como funciona" selected={about} onPress={() => setAbout(true)}/></View>
    {about ? <>
      <Copy>A classificação usa a média de EV por pessoa que participou da equipe neste mês, incluindo quem não registrou pontos. EV verde e azul contribuem para o mesmo resultado.</Copy>
      <Copy muted>Contam os dias desde a entrada até o dia anterior à saída. Entrar em uma equipe não transfere pontos de dias anteriores. Quem sai continua na média daquele mês, com os pontos dos dias em que participou.</Copy>
      <Copy muted>Somente equipes com pelo menos 10 participantes elegíveis aparecem. Os resultados são agregados e não mostram atividades individuais.</Copy>
      <Copy muted>A classificação é consolidada automaticamente a cada 15 minutos. Atualizar esta tela consulta o último resultado disponível. O ranking reúne EV válido de diferentes organizações e se renova a cada mês. Se você participa de várias equipes, seus pontos elegíveis contribuem para cada uma, uma vez por equipe.</Copy>
      <Copy muted>Os resultados do mês são parciais e podem mudar com novos registros e atividades retroativas aprovadas. Pontuações iguais compartilham a mesma posição.</Copy>
    </> : <>
      {!!error && <Notice>{error}</Notice>}
      {busy && <Copy muted>Carregando classificação…</Copy>}
      {!busy && !error && metadata?.period.status !== 'awaiting_calculation' && !items.length && <Card title="Vamos crescer juntos"><Copy>A classificação aparece quando houver equipes com pelo menos 10 participantes elegíveis neste mês.</Copy></Card>}
      {!busy && !error && metadata?.period.status === 'awaiting_calculation' && <Notice>A classificação deste mês está sendo preparada. A próxima apuração acontece automaticamente.</Notice>}
      {!!items.length && <View style={s.caption}><Text style={s.eyebrow}>EQUIPES</Text><Text style={s.eyebrow}>EV MÉDIA</Text></View>}
      {items.map(team => <View key={team.id} style={[s.row, team.is_my_team && s.mine]}>
        <Text style={s.position}>{String(team.position).padStart(2, '0')}</Text>
        <View style={s.avatar}><Icon name="trophy" color={team.is_my_team ? colors.lime : colors.primary} size={22}/></View>
        <View style={s.name}><Text style={s.title}>{team.name}</Text><Text style={s.subtitle}>{team.is_my_team ? 'Você participa desta equipe.' : 'Uma jornada compartilhada.'}</Text></View>
        <Text style={s.score}>{team.score.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</Text>
      </View>)}
      {!!metadata?.calculated_at && <Copy muted>Resultado parcial · atualizado em {new Date(metadata.calculated_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })}</Copy>}
      {more && <Button secondary title="Carregar mais equipes" disabled={busy} onPress={loadMore}/>}
      <Button secondary title={error ? 'Tentar novamente' : 'Atualizar classificação'} disabled={busy} onPress={refresh}/>
    </>}
  </Flow>;
}
const s = StyleSheet.create({ caption: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingBottom: 8 }, eyebrow: { color: colors.muted, fontFamily: 'Montserrat_500Medium', fontSize: 9, letterSpacing: 1.4 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 22, borderBottomWidth: 1, borderBottomColor: colors.border }, mine: { backgroundColor: '#07364D', marginHorizontal: -12, paddingHorizontal: 12, borderRadius: 14 }, position: { fontFamily: 'Montserrat_500Medium', color: colors.primary, fontSize: 13 }, avatar: { height: 38, width: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, name: { flex: 1, gap: 7 }, title: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, color: colors.text }, subtitle: { fontFamily: 'Montserrat_400Regular', fontSize: 10, color: colors.muted }, score: { fontFamily: 'Montserrat_600SemiBold', color: colors.primary, fontSize: 20 } });
