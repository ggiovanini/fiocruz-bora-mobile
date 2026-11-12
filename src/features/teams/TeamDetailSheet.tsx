import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { apiRequest } from '@/api/session';
import { uuid } from '@/api/activityMapping';
import { usePagedResource } from '@/api/usePagedResource';
import { Button, Copy, Notice } from '@/ui/Flow';
import { Sheet } from '@/ui/Sheet';
import { SegmentedTabs } from '@/ui/SegmentedTabs';
import { colors } from '@/design/tokens';
import { ParticipantIdentity, type Participant } from './ParticipantIdentity';

export type TeamSummary = { id: string; name: string };
export type Team = TeamSummary & { description: string | null; active: boolean; participant_count: number; participation: { joined: boolean; revision: number } };
type Props = { team: TeamSummary; onClose: () => void; onChanged: () => void; preview?: boolean };

export function TeamDetailSheet(props: Props) {
  return props.preview ? <PreviewTeamDetails {...props}/> : <LiveTeamDetails {...props}/>;
}

function LiveTeamDetails({ team: selected, onClose, onChanged }: Props) {
  const { items, metadata, busy, error, more, refresh, loadMore } = usePagedResource<Participant, { team: Team }>(`/teams/${selected.id}`);
  const team = metadata?.team;
  const [section, setSection] = useState<'members' | 'participation'>('members');
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState('');
  const inFlight = useRef(false);
  const pending = useRef<{ signature: string; key: string } | null>(null);

  async function change() {
    if (!team || inFlight.current || busy) return;
    inFlight.current = true; setSending(true); setFailure('');
    const signature = `${team.id}:${team.participation.revision}:${!team.participation.joined}`;
    if (!pending.current || pending.current.signature !== signature) pending.current = { signature, key: uuid() };
    try {
      await apiRequest(`/teams/${team.id}/participation`, { method: 'PUT', body: JSON.stringify({ joined: !team.participation.joined, revision: team.participation.revision, operation_key: pending.current.key }) });
      pending.current = null;
      refresh();
      onChanged();
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'Não foi possível atualizar sua participação.');
      // Reload revisions after concurrent changes; retries retain their operation key.
      refresh();
    } finally { inFlight.current = false; setSending(false); }
  }

  return <Sheet visible title="Detalhes da equipe" onClose={() => { if (!inFlight.current) onClose(); }}>
    <TeamInfo name={team?.name ?? selected.name} description={team?.description} count={team?.participant_count}/>
    <DetailTabs value={section} onChange={setSection}/>
    {!!error && <><Notice>{error}</Notice><Button secondary title="Tentar novamente" disabled={busy || sending} onPress={refresh}/></>}
    {section === 'members' ? <>
      {team && <Members people={items} total={team.participant_count}/>}
      {busy && <Copy muted>Carregando membros…</Copy>}
      {more && <Button secondary title="Carregar mais membros" disabled={busy || sending} onPress={loadMore}/>}
    </> : <>
      {team && <>
        <Copy muted>{team.participation.joined ? 'Você participa desta equipe.' : 'Você ainda não participa desta equipe.'}</Copy>
        {!team.active && <Notice>Equipe pausada para novas entradas.</Notice>}
        {!!failure && <Notice>{failure}</Notice>}
        <Button secondary={team.participation.joined} title={team.participation.joined ? 'Sair da equipe' : 'Entrar na equipe'} busy={sending} disabled={sending || busy || (!team.active && !team.participation.joined)} onPress={() => { void change(); }}/>
      </>}
      {busy && <Copy muted>Atualizando participação…</Copy>}
    </>}
  </Sheet>;
}

function PreviewTeamDetails({ team, onClose }: Props) {
  const [joined, setJoined] = useState(team.id === '1');
  const [section, setSection] = useState<'members' | 'participation'>('members');
  const people: Participant[] = [
    { id: 'example-a', name: 'Pessoa A', level: 3, vitality_points: 480 },
    { id: 'example-b', name: 'Pessoa B', level: 2, vitality_points: 220 },
    ...(joined ? [{ id: 'example-me', name: 'Você', level: 2, vitality_points: 180, is_me: true }] : []),
  ];
  return <Sheet visible title="Detalhes da equipe" onClose={onClose}>
    <TeamInfo name={team.name} count={people.length}/>
    <DetailTabs value={section} onChange={setSection}/>
    {section === 'members' ? <Members people={people} total={people.length}/> : <>
      <Copy muted>{joined ? 'Você participa desta equipe.' : 'Você ainda não participa desta equipe.'}</Copy>
      <Button secondary={joined} title={joined ? 'Sair da equipe' : 'Entrar na equipe'} onPress={() => setJoined(value => !value)}/>
    </>}
    <Copy muted>Dados de exemplo.</Copy>
  </Sheet>;
}

function TeamInfo({ name, description, count }: { name: string; description?: string | null; count?: number }) {
  return <View style={s.info}>
    <Text accessibilityRole="header" style={s.teamName}>{name}</Text>
    {!!description && <Copy muted>{description}</Copy>}
    {count != null && <Text style={s.count}>{count.toLocaleString('pt-BR')} {count === 1 ? 'membro' : 'membros'}</Text>}
  </View>;
}

function DetailTabs({ value, onChange }: { value: 'members' | 'participation'; onChange: (value: 'members' | 'participation') => void }) {
  return <SegmentedTabs label="Informações da equipe" options={[{ id: 'members', label: 'Membros' }, { id: 'participation', label: 'Participação' }]} value={value} onChange={onChange}/>;
}


function Members({ people, total }: { people: Participant[]; total: number }) {
  return <View>
    {!total && <Copy muted>Nenhum membro nesta equipe ainda.</Copy>}
    {people.map(person => <View key={person.id} style={[s.row, person.is_me && s.mine]}><ParticipantIdentity person={person}/></View>)}
  </View>;
}
const s = StyleSheet.create({
  info: { gap: 8 },
  teamName: { fontFamily: 'Montserrat_600SemiBold', fontSize: 20, lineHeight: 28, color: colors.text },
  count: { fontFamily: 'Montserrat_500Medium', fontSize: 12, color: colors.muted },
  row: { paddingVertical: 22, borderTopWidth: 1, borderTopColor: colors.border },
  mine: { backgroundColor: '#07364D', marginHorizontal: -12, paddingHorizontal: 12, borderRadius: 14 },
});
