import { useState } from 'react';
import { InstitutionalAccess } from './InstitutionalAccess';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePagedResource } from '@/api/usePagedResource';
import { useMock } from '@/mocks/MockProvider';
import { Button, Card, Copy, Notice } from '@/ui/Flow';
import { ListScreen } from '@/ui/ListScreen';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { newDraft } from '@/mocks/model';
import { ChallengeCard, ChallengeDetail } from './challenges/ChallengeViews';
import type { Challenge } from './challenges/model';
export default function Challenges() {
  const { state } = useMock();
  return <InstitutionalAccess title="Desafios"><OrganizationChallenges key={state.membershipId}/></InstitutionalAccess>;
}
function OrganizationChallenges() {
  const { state, dispatch, api } = useMock();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { items, metadata, busy, error, more, refresh, loadMore } = usePagedResource<Challenge, { total: number }>(`/memberships/${state.membershipId}/challenges${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  function applySearch() { setSelectedId(null); setQuery(search.trim()); }
  const selected = items.find(item => item.id === selectedId);
  function register() {
    if (!selected) return;
    if (!state.draft && selected.activity_type) {
      const item = api.data.catalog.find(item => item.code === selected.activity_type);
      if (item) dispatch({ type: 'draft', value: { ...newDraft(), type: item.name, activityCode: item.code, energyDimension: item.energy_dimension === 'physical' || item.energy_dimension === 'intellectual' ? item.energy_dimension : undefined, date: api.data.energy?.today.date ?? newDraft().date } });
    }
    setSelectedId(null);
    router.push('/activity');
  }
  return <ListScreen title="Desafios" icon="target" back={false} search={{value:search,onChangeText:setSearch,onSubmit:applySearch,activeQuery:query,onClear:()=>{setSearch('');setQuery('');setSelectedId(null);},placeholder:'Nome ou descrição'}}>
    <View style={s.toolbar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Minhas medalhas" onPress={()=>router.push('/medals')} style={s.action}><Icon name="trophy" size={20}/><Text style={s.label}>Medalhas</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Atualizar desafios" accessibilityState={{disabled:busy,busy}} disabled={busy} onPress={()=>{setSelectedId(null);refresh();}} style={[s.action,busy&&{opacity:.5}]}><Icon name="clock" size={20}/><Text style={s.label}>Atualizar</Text></Pressable>
    </View>
    {!!metadata?.total && <Copy muted>{items.length} de {metadata.total} {metadata.total === 1 ? 'desafio' : 'desafios'}{query ? metadata.total === 1 ? ' encontrado' : ' encontrados' : ''}</Copy>}
    {!!error && <><Notice>{error}</Notice><Button secondary title="Tentar novamente" disabled={busy} onPress={refresh}/></>}
    {busy && <Copy muted>Carregando desafios…</Copy>}
    {!busy && !error && !items.length && <Card title={query ? "Nenhum desafio encontrado" : "Sua próxima conquista vem aí"}><Copy>{query ? "Tente outro termo ou limpe a busca." : "Nenhum desafio publicado para sua organização no momento."}</Copy></Card>}
    {items.map(challenge=><ChallengeCard key={challenge.id} challenge={challenge} onPress={()=>setSelectedId(challenge.id)}/>)}
    {more && <Button secondary title="Carregar mais desafios" disabled={busy} onPress={loadMore}/>}
    <ChallengeDetail challenge={selected} onClose={()=>setSelectedId(null)} onRegister={register} hasDraft={!!state.draft} onMedals={()=>{setSelectedId(null);router.push('/medals');}}/>
  </ListScreen>;
}
const s=StyleSheet.create({toolbar:{flexDirection:'row',justifyContent:'space-between',gap:12},action:{minHeight:44,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:6},label:{color:colors.text,fontSize:12,fontFamily:'Montserrat_500Medium'}});
