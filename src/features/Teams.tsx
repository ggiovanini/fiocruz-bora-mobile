import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { apiRequest } from '@/api/session';
import { uuid } from '@/api/activityMapping';
import { usePagedResource } from '@/api/usePagedResource';
import { Button, Card, Copy, Notice } from '@/ui/Flow';
import { ListScreen } from '@/ui/ListScreen';
import { Sheet } from '@/ui/Sheet';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
type Team = { id: string; name: string; description: string | null; active: boolean; participation: { joined: boolean; revision: number } };
export default function Teams() {
  const [tab, setTab] = useState<'joined' | 'available'>('joined');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Team | null>(null);
  const { items, metadata, busy, error, more, loadMore, refresh } = usePagedResource<Team, { total: number }>(`/teams?participation=${tab}${query ? `&q=${encodeURIComponent(query)}` : ''}`);
  const [sending, setSending] = useState('');
  const [failure, setFailure] = useState('');
  const inFlight = useRef(false);
  const pending = useRef<{ signature: string; key: string } | null>(null);
  const change = async (team: Team) => {
    if (inFlight.current) return;
    inFlight.current = true; setSending(team.id); setFailure('');
    const signature = `${team.id}:${team.participation.revision}:${!team.participation.joined}`;
    if (!pending.current || pending.current.signature !== signature) pending.current = { signature, key: uuid() };
    try {
      await apiRequest(`/teams/${team.id}/participation`, { method: 'PUT', body: JSON.stringify({ joined: !team.participation.joined, revision: team.participation.revision, operation_key: pending.current.key }) });
      pending.current = null; setSelected(null); refresh();
    } catch (e) { setFailure(e instanceof Error ? e.message : 'Não foi possível atualizar sua participação.'); }
    finally { inFlight.current = false; setSending(''); }
  };
  function closeDetail() { if (!inFlight.current) { setSelected(null); setFailure(''); } }
  return <ListScreen title="Equipes" icon="users" search={{ value: search, onChangeText: setSearch, onSubmit: () => setQuery(search.trim()), activeQuery: query, onClear: () => { setSearch(''); setQuery(''); }, placeholder: 'Nome ou descrição da equipe' }}>
    <View style={s.tabs}>{([{ id: 'joined', label: 'Minhas' }, { id: 'available', label: 'Outras' }] as const).map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: tab === item.id }} onPress={() => setTab(item.id)} style={s.tab}><Text style={[s.tabText, tab === item.id && s.tabSelected]}>{item.label}</Text></Pressable>)}</View>
    <View style={s.toolbar}>
      <Text style={s.count}>{metadata ? `${metadata.total} ${metadata.total === 1 ? 'equipe' : 'equipes'}${query ? ' na busca' : ''}` : ''}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Atualizar equipes" disabled={busy || !!sending} onPress={refresh} style={[s.refresh, (busy || !!sending) && { opacity: .5 }]}><Icon name="clock" size={18}/><Text style={s.refreshText}>Atualizar</Text></Pressable>
    </View>
    {!!error && <><Notice>{error}</Notice><Button secondary title="Tentar novamente" disabled={busy} onPress={refresh}/></>}
    {busy && <Copy muted>Carregando equipes…</Copy>}
    {!busy && !error && !items.length && <Card title={query ? 'Nenhuma equipe encontrada' : tab === 'joined' ? 'Sua próxima equipe está por aqui' : 'Novas conexões vêm aí'}><Copy>{query ? 'Tente outro termo ou limpe a busca.' : tab === 'joined' ? 'Você ainda não participa de equipes. Explore a aba Outras para encontrar a sua.' : 'Nenhuma outra equipe disponível no momento.'}</Copy></Card>}
    {items.map(team => <Pressable key={team.id} accessibilityRole="button" accessibilityLabel={`${team.name}. ${team.participation.joined ? 'Você participa' : 'Aberta para participar'}. Ver detalhes.`} onPress={() => { setFailure(''); setSelected(team); }} style={({ pressed }) => [s.card, pressed && { opacity: .75 }]}>
      <View style={s.row}><View style={s.teamIcon}><Icon name="users" size={24}/></View><View style={s.main}><Text style={s.title} numberOfLines={2}>{team.name}</Text><View style={s.statusRow}><Icon name={team.participation.joined ? 'check' : 'plus'} size={13} color={team.participation.joined ? colors.lime : colors.primary}/><Text style={[s.status, team.participation.joined && { color: colors.lime }]}>{team.participation.joined ? 'Você participa' : 'Aberta para participar'}</Text></View></View><Icon name="arrow" size={18}/></View>
      {!!team.description && <Text style={s.description} numberOfLines={2}>{team.description}</Text>}
      {!team.active && <Text style={s.description}>Pausada para novas entradas</Text>}
    </Pressable>)}
    {more && <Button secondary title="Carregar mais equipes" disabled={busy || !!sending} onPress={loadMore}/>}
    <Sheet visible={!!selected} title={selected?.name ?? 'Equipe'} onClose={closeDetail}>
      {selected && <>
        <Copy muted>{selected.participation.joined ? 'Você participa desta equipe.' : 'Encontre pessoas com um propósito em comum.'}</Copy>
        {!!selected.description && <Copy>{selected.description}</Copy>}
        {!selected.active && <Notice>A equipe está pausada para novas entradas.</Notice>}
        <Copy muted>Você pode participar de equipes de diferentes organizações e sair quando quiser.</Copy>
        {!!failure && <Notice>{failure}</Notice>}
        <Button secondary={selected.participation.joined} title={selected.participation.joined ? 'Sair da equipe' : 'Entrar na equipe'} busy={sending === selected.id} disabled={!!sending || busy || (!selected.active && !selected.participation.joined)} onPress={() => { void change(selected); }}/>
      </>}
    </Sheet>
  </ListScreen>;
}
const s = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 24, paddingHorizontal: 18 }, tab: { minHeight: 44, justifyContent: 'center' },
  tabText: { color: colors.muted, fontFamily: 'Montserrat_500Medium', fontSize: 14 }, tabSelected: { color: colors.primary, fontFamily: 'Montserrat_700Bold' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, count: { color: colors.muted, fontFamily: 'Montserrat_500Medium', fontSize: 11 },
  refresh: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }, refreshText: { color: colors.text, fontFamily: 'Montserrat_500Medium', fontSize: 12 },
  card: { padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, teamIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1, minWidth: 0, gap: 5 }, title: { color: colors.text, fontFamily: 'Montserrat_600SemiBold', fontSize: 16, lineHeight: 22 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, status: { color: colors.primary, fontFamily: 'Montserrat_500Medium', fontSize: 11, flexShrink: 1 },
  description: { color: colors.muted, fontFamily: 'Montserrat_400Regular', fontSize: 12, lineHeight: 18 },
});
