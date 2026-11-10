import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { usePagedResource } from '@/api/usePagedResource';
import { Button, Card, Copy, Notice } from '@/ui/Flow';
import { ListScreen } from '@/ui/ListScreen';
import { Sheet } from '@/ui/Sheet';
import { RankingToolbar } from './RankingToolbar';
import { colors } from '@/design/tokens';
import { Icon } from '@/design/Icon';
type Row = { id: string; name: string; position: number; score: number; is_my_team: boolean; participant_count: number };
type Metadata = { period: { month: string; starts_on: string; ends_on: string; timezone: string; status: string }; calculated_at: string | null; minimum_participants: number };
const date = (value: string) => value.split('-').reverse().join('/');
export default function MonthlyTeamRanking() {
  const [period, setPeriod] = useState<'current'|'previous'>('current');
  return <RankingPeriod key={period} period={period} onPeriodChange={setPeriod}/>;
}
function RankingPeriod({period,onPeriodChange}:{period:'current'|'previous';onPeriodChange:(period:'current'|'previous')=>void}) {
  const router = useRouter();
  const [about, setAbout] = useState(false);
  const { items, metadata, busy, error, more, loadMore, refresh } = usePagedResource<Row, Metadata>(`/rankings/teams/monthly?period=${period}`);
  return <ListScreen title="Ranking" icon="trophy" back={false}>
    <RankingToolbar onTeams={()=>router.push('/teams')} onAbout={()=>setAbout(true)} onRefresh={refresh} busy={busy}/>
    <View style={s.tabs}>
      {([{id:'current',label:'Atual'},{id:'previous',label:'Mês anterior'}] as const).map(tab=><Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{selected:period===tab.id}} onPress={()=>onPeriodChange(tab.id)} style={s.tab}><Text style={[s.tabText,period===tab.id&&s.tabSelected]}>{tab.label}</Text></Pressable>)}
    </View>
    <Sheet visible={about} title="Como funciona o ranking" onClose={()=>setAbout(false)}>
      {!!metadata && <Copy muted>Período selecionado: {date(metadata.period.starts_on)} a {date(metadata.period.ends_on)} · Horário de Brasília.</Copy>}
      {!!metadata?.calculated_at && <Copy muted>Última apuração: {new Date(metadata.calculated_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })} · Horário de Brasília.</Copy>}
      <Copy muted>Os períodos começam no primeiro dia e terminam no último dia de cada mês, pelo horário de Brasília.</Copy>
      <Copy>A classificação usa a média de EV por pessoa que participou da equipe no período selecionado, incluindo quem não registrou pontos. Atividades físicas e mentais contribuem para o mesmo resultado.</Copy>
      <Copy muted>Contam os dias desde a entrada até o dia anterior à saída. Entrar em uma equipe não transfere pontos de dias anteriores. Quem sai continua na média daquele mês, com os pontos dos dias em que participou.</Copy>
      <Copy muted>Somente equipes com pelo menos 10 participantes elegíveis aparecem. Os resultados são agregados e não mostram atividades individuais.</Copy>
      <Copy muted>A classificação é consolidada automaticamente a cada 15 minutos. Atualizar esta tela consulta o último resultado disponível. O ranking reúne EV válido de diferentes organizações e se renova a cada mês. Se você participa de várias equipes, seus pontos elegíveis contribuem para cada uma, uma vez por equipe.</Copy>
      <Copy muted>{metadata?.period.status === 'closed' ? 'Este período está encerrado e seus resultados são definitivos.' : 'Os resultados são parciais e podem mudar com novos registros e atividades retroativas aprovadas.'} Pontuações iguais compartilham a mesma posição.</Copy>
    </Sheet>
      {!!error && <Notice>{error}</Notice>}
      {busy && <Copy muted>Carregando classificação…</Copy>}
      {!busy && !error && metadata?.period.status !== 'awaiting_calculation' && !items.length && <Card title="Vamos crescer juntos"><Copy>A classificação aparece quando houver equipes com pelo menos 10 participantes elegíveis no período selecionado.</Copy></Card>}
      {!busy && !error && metadata?.period.status === 'awaiting_calculation' && <Notice>A classificação do período selecionado está sendo preparada. A próxima apuração acontece automaticamente.</Notice>}
      {!!items.length && <View style={s.caption}><Text style={s.eyebrow}>EQUIPES</Text><Text style={s.eyebrow}>EV MÉDIA</Text></View>}
      {items.map(team => <View key={team.id} style={[s.row, team.is_my_team && s.mine]}>
        <Text style={s.position}>{String(team.position).padStart(2, '0')}</Text>
        <View style={s.avatar}><Icon name="trophy" color={team.is_my_team ? colors.lime : colors.primary} size={22}/></View>
        <View style={s.name}><Text style={s.title}>{team.name}</Text><View style={[s.badge,team.is_my_team&&s.memberBadge]}><Text style={[s.badgeText,team.is_my_team&&s.memberBadgeText]}>{team.is_my_team ? 'Você participa' : 'Você não participa'}</Text></View></View>
        <Text style={s.score}>{team.score.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</Text>
      </View>)}

      {more && <Button secondary title="Carregar mais equipes" disabled={busy} onPress={loadMore}/>}
      {!!error && <Button secondary title="Tentar novamente" disabled={busy} onPress={refresh}/>}
  </ListScreen>;
}
const s = StyleSheet.create({badge:{alignSelf:'flex-start',paddingHorizontal:8,paddingVertical:4,borderRadius:8,backgroundColor:colors.surface},memberBadge:{backgroundColor:'#173F35'},badgeText:{fontFamily:'Montserrat_500Medium',fontSize:10,lineHeight:15,color:colors.muted},memberBadgeText:{color:colors.lime}, tabs:{flexDirection:'row',gap:24},tab:{minHeight:44,justifyContent:'center'},tabText:{color:colors.muted,fontFamily:'Montserrat_500Medium',fontSize:14},tabSelected:{color:colors.primary,fontFamily:'Montserrat_700Bold'},caption: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingBottom: 8 }, eyebrow: { color: colors.muted, fontFamily: 'Montserrat_500Medium', fontSize: 9, letterSpacing: 1.4 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 22, borderBottomWidth: 1, borderBottomColor: colors.border }, mine: { backgroundColor: '#07364D', marginHorizontal: -12, paddingHorizontal: 12, borderRadius: 14 }, position: { fontFamily: 'Montserrat_500Medium', color: colors.primary, fontSize: 13 }, avatar: { height: 38, width: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, name: { flex: 1, gap: 7 }, title: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, color: colors.text }, subtitle: { fontFamily: 'Montserrat_400Regular', fontSize: 10, color: colors.muted }, score: { fontFamily: 'Montserrat_600SemiBold', color: colors.primary, fontSize: 20 } });
