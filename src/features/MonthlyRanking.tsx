import { TeamDetailSheet, type TeamSummary } from './teams/TeamDetailSheet';
import { ParticipantIdentity } from './teams/ParticipantIdentity';
import { SegmentedTabs } from '@/ui/SegmentedTabs';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { usePagedResource } from '@/api/usePagedResource';
import { apiEnabled } from '@/api/session';
import { Button, Card, Copy, Notice } from '@/ui/Flow';
import { ListScreen } from '@/ui/ListScreen';
import { Sheet } from '@/ui/Sheet';
import { RankingToolbar } from './RankingToolbar';
import { colors } from '@/design/tokens';
import { Icon } from '@/design/Icon';

type Subject = 'individual' | 'teams';
type Period = 'current' | 'previous';
type Row = { id: string; name: string; position: number; score: number; is_my_team?: boolean; is_me?: boolean; level?: number | null; vitality_points?: number; participant_count?: number };
type Metadata = { period: { month: string; starts_on: string; ends_on: string; timezone: string; status: string }; calculated_at: string | null; minimum_participants?: number };
type Resource = { items: Row[]; metadata: Metadata | null; busy: boolean; error: string; more: boolean; loadMore: () => void; refresh: () => void };
type Selection = { subject: Subject; period: Period; onPeriodChange: (period: Period) => void };

export default function MonthlyRanking() {
  const router = useRouter();
  const [subject, setSubject] = useState<Subject>('individual');
  const [period, setPeriod] = useState<Period>('current');
  const selection = { subject, period, onPeriodChange: setPeriod };
  return <ListScreen title="Ranking" icon="trophy" back={false} titleAction={
    <Pressable accessibilityRole="button" accessibilityLabel="Abrir minhas equipes" onPress={() => router.push('/teams')} style={({pressed}) => [s.teamsLink, pressed && {opacity: .5}]}>
      <Icon name="users" size={18}/><Text style={s.teamsLinkText}>Minhas equipes</Text>
    </Pressable>
  }>
    <SegmentedTabs label="Tipo de ranking" options={[{ id: 'individual', label: 'Individual' }, { id: 'teams', label: 'Equipes' }]} value={subject} onChange={setSubject}/>
    {apiEnabled ? <LiveRanking key={`${subject}-${period}`} {...selection}/> : <PreviewRanking key={`${subject}-${period}`} {...selection}/>}
  </ListScreen>;
}
function LiveRanking(selection: Selection) {
  const resource = usePagedResource<Row, Metadata>(`/rankings/${selection.subject}/monthly?period=${selection.period}`);
  return <RankingContent {...selection} resource={resource}/>;
}
function PreviewRanking(selection: Selection) {
  const [updated, setUpdated] = useState(false);
  const teams = selection.subject === 'teams';
  const names = teams ? ['Equipe A', 'Sua equipe', 'Equipe C'] : ['Pessoa A', 'Você', 'Pessoa C'];
  const resource: Resource = { items: names.map((name, i) => ({ id: String(i), name, position: i + 1, score: 0, is_my_team: teams && i === 1, is_me: !teams && i === 1, level: teams ? undefined : 3 - i, vitality_points: teams ? undefined : 480 - i * 150, participant_count: teams ? 12 - i * 2 : undefined })), metadata: null, busy: false, error: '', more: false, loadMore: () => {}, refresh: () => setUpdated(true) };
  return <><RankingContent {...selection} resource={resource} preview/><Copy muted>{updated ? 'Exemplo atualizado. ' : ''}Classificação com dados de exemplo.</Copy></>;
}
function RankingContent({ subject, period, onPeriodChange, resource, preview = false }: Selection & { resource: Resource; preview?: boolean }) {
  const [about, setAbout] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamSummary | null>(null);
  const teams = subject === 'teams';
  const { items, metadata, busy, error, more, loadMore, refresh } = resource;
  return <>
    <RankingToolbar period={period} onPeriodChange={onPeriodChange} onAbout={() => setAbout(true)} onRefresh={refresh} busy={busy}/>
    <Sheet visible={about} title={`Como funciona o ranking ${teams ? 'de equipes' : 'individual'}`} onClose={() => setAbout(false)}>
      <Copy muted>Os períodos começam no primeiro dia e terminam no último dia de cada mês, pelo horário de Brasília.</Copy>
      {teams ? <>
        <Copy>A classificação usa a média de EV por pessoa que participou da equipe no período selecionado, incluindo quem não registrou pontos. Atividades físicas e mentais contribuem para o mesmo resultado.</Copy>
        <Copy muted>Contam os dias desde a entrada até o dia anterior à saída. Entrar em uma equipe não transfere pontos de dias anteriores. Quem sai continua na média daquele mês, com os pontos dos dias em que participou.</Copy>
        <Copy muted>Somente equipes com pelo menos {metadata?.minimum_participants ?? 5} participantes elegíveis aparecem. A quantidade de participantes exibida é a considerada no período selecionado. Os resultados são agregados e não mostram atividades individuais.</Copy>
        <Copy muted>Se você participa de várias equipes, seus pontos elegíveis contribuem para cada uma, uma vez por equipe.</Copy>
      </> : <>
        <Copy>A classificação usa o total de EV de cada pessoa no mês selecionado. Atividades físicas e mentais aprovadas contribuem para o mesmo resultado, independentemente da participação em equipes.</Copy>
        <Copy muted>Aparecem as pessoas com EV válido no período. A lista mostra nome, posição, pontuação, nível e vitalidade atuais. Nível e vitalidade são os mesmos indicadores da jornada pessoal e não alteram a classificação mensal. As atividades individuais não são exibidas.</Copy>
      </>}
      <Copy muted>A classificação é consolidada automaticamente a cada 15 minutos. Atualizar esta tela consulta o último resultado disponível. O ranking reúne EV válido de diferentes organizações e se renova a cada mês.</Copy>
      <Copy muted>{metadata?.period.status === 'closed' ? 'Este período está encerrado e seus resultados são definitivos.' : 'Os resultados são parciais e podem mudar com novos registros e atividades retroativas aprovadas.'} Pontuações iguais compartilham a mesma posição.</Copy>
    </Sheet>
    {!!error && <Notice>{error}</Notice>}
    {busy && <Copy muted>Carregando classificação…</Copy>}
    {!busy && !error && metadata?.period.status !== 'awaiting_calculation' && !items.length && <Card title={teams ? 'Vamos crescer juntos' : 'Vamos movimentar este ranking'}><Copy>{teams ? `A classificação aparece quando houver equipes com pelo menos ${metadata?.minimum_participants ?? 5} participantes elegíveis no período selecionado.` : 'A classificação aparece quando houver pessoas com EV válido no período selecionado.'}</Copy></Card>}
    {!busy && !error && metadata?.period.status === 'awaiting_calculation' && <Notice>A classificação do período selecionado está sendo preparada. A próxima apuração acontece automaticamente.</Notice>}
    {!!items.length && <View>
    <View style={s.caption}><Text style={s.eyebrow}>{teams ? 'EQUIPES' : 'PESSOAS'}</Text><Text style={s.eyebrow}>{teams ? 'EV MÉDIA' : 'EV TOTAL'}</Text></View>
    {items.map(row => {
      const mine = teams ? row.is_my_team : row.is_me;
      const RowContainer = teams ? Pressable : View;
      return <RowContainer key={row.id} {...(teams ? { accessibilityRole: 'button' as const, accessibilityLabel: `${row.name}. Ver equipe e participantes.`, onPress: () => setSelectedTeam(row) } : {})} style={[s.row, mine && s.mine]}>
        <Text style={s.position}>{String(row.position).padStart(2, '0')}</Text>
        {teams ? <>
          <View style={s.avatar}><Icon name="trophy" color={mine ? colors.lime : colors.primary} size={22}/></View>
          <View style={s.name}><Text style={s.title}>{row.name}</Text>
            {row.participant_count != null && <Text style={s.subtitle}>{row.participant_count.toLocaleString('pt-BR')} {row.participant_count === 1 ? 'participante' : 'participantes'}</Text>}
            <View style={[s.badge, mine && s.memberBadge]}><Text style={[s.badgeText, mine && s.memberBadgeText]}>{mine ? 'Você participa' : 'Você não participa'}</Text></View>
          </View>
        </> : <ParticipantIdentity person={row}/>}
        <Text style={s.score}>{preview ? '—' : row.score.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</Text>
        {teams && <Icon name="arrow" size={16}/>}
      </RowContainer>;
    })}
    </View>}
    {selectedTeam && <TeamDetailSheet key={selectedTeam.id} team={selectedTeam} onClose={() => setSelectedTeam(null)} onChanged={refresh} preview={preview}/>}
    {more && <Button secondary title={teams ? 'Carregar mais equipes' : 'Carregar mais pessoas'} disabled={busy} onPress={loadMore}/>}
    {!!error && <Button secondary title="Tentar novamente" disabled={busy} onPress={refresh}/>}
  </>;
}
const s = StyleSheet.create({teamsLink:{minHeight:44,flexDirection:'row',alignItems:'center',gap:6},teamsLinkText:{fontFamily:'Montserrat_500Medium',fontSize:11,color:colors.text},badge:{alignSelf:'flex-start',paddingHorizontal:8,paddingVertical:4,borderRadius:8,backgroundColor:colors.surface},memberBadge:{backgroundColor:'#173F35'},badgeText:{fontFamily:'Montserrat_500Medium',fontSize:10,lineHeight:15,color:colors.muted},memberBadgeText:{color:colors.lime},caption: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8 }, eyebrow: { color: colors.muted, fontFamily: 'Montserrat_500Medium', fontSize: 9, letterSpacing: 1.4 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 22, borderTopWidth: 1, borderTopColor: colors.border }, mine: { backgroundColor: '#07364D', marginHorizontal: -12, paddingHorizontal: 12, borderRadius: 14 }, position: { fontFamily: 'Montserrat_500Medium', color: colors.primary, fontSize: 13 }, avatar: { height: 38, width: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, name: { flex: 1, gap: 7 }, title: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, color: colors.text }, subtitle: { fontFamily: 'Montserrat_400Regular', fontSize: 11, lineHeight: 16, color: colors.muted }, score: { fontFamily: 'Montserrat_600SemiBold', color: colors.primary, fontSize: 20 } });
