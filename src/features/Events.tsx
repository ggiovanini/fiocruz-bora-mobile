import { InstitutionalAccess } from './InstitutionalAccess';
import { useState, useRef, useCallback } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { apiRequest } from '@/api/session';
import { usePagedResource } from '@/api/usePagedResource';
import { useMock } from '@/mocks/MockProvider';
import { Button, Card, Copy, Field, Flow, Notice } from '@/ui/Flow';
import { ListScreen } from '@/ui/ListScreen';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { EventCard, EventDetail } from './events/EventViews';
import { EventTabs, eventEmptyCopy, type EventTab } from './events/EventTabs';
import type { Event } from './events/model';
export function LiveEvents() {
  const { state } = useMock();
  return <InstitutionalAccess title="Eventos"><OrganizationEvents key={state.membershipId}/></InstitutionalAccess>;
}
function OrganizationEvents() {
  const [tab,setTab]=useState<EventTab>('upcoming');
  return <EventList key={tab} tab={tab} onTabChange={setTab}/>;
}
function EventList({tab,onTabChange}:{tab:EventTab;onTabChange:(tab:EventTab)=>void}) {
  const { state } = useMock();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { items, metadata, busy, error, more, refresh, loadMore } = usePagedResource<Event, { total: number }>(`/memberships/${state.membershipId}/events?tab=${tab}${query ? `&q=${encodeURIComponent(query)}` : ''}`);
  const selected = items.find(event => event.id === selectedId);
  return <ListScreen title="Eventos" icon="calendar" search={{ value:search,onChangeText:setSearch,onSubmit:()=>{setSelectedId(null);setQuery(search.trim());},activeQuery:query,onClear:()=>{setSelectedId(null);setSearch('');setQuery('');},placeholder:'Nome, descrição ou local' }}>
    <View style={s.toolbar}><Pressable accessibilityRole="button" accessibilityLabel="Atualizar eventos" accessibilityState={{ disabled:busy,busy }} disabled={busy} onPress={refresh} style={[s.action,busy&&{opacity:.5}]}><Icon name="clock" size={20}/><Text style={s.label}>Atualizar</Text></Pressable></View>
    <EventTabs value={tab} onChange={onTabChange}/>
    {!!metadata?.total && <Copy muted>{items.length} de {metadata.total} {metadata.total === 1 ? 'evento' : 'eventos'}{query ? metadata.total === 1 ? ' encontrado' : ' encontrados' : ''}</Copy>}
    {!!error && <><Notice>{error}</Notice><Button secondary title="Tentar novamente" disabled={busy} onPress={refresh}/></>}
    {busy && <Copy muted>Carregando eventos…</Copy>}
    {!busy && !error && !items.length && <Card title={query ? 'Nenhum evento encontrado' : eventEmptyCopy[tab].title}><Copy>{query ? 'Tente outro termo ou limpe a busca.' : eventEmptyCopy[tab].body}</Copy></Card>}
    {items.map(event => <EventCard key={event.id} event={event} onPress={() => setSelectedId(event.id)}/>)}
    {more && <Button secondary title="Carregar mais eventos" disabled={busy} onPress={loadMore}/>}
    <EventDetail event={selected} onClose={()=>setSelectedId(null)} onCheckIn={()=>{
      if (!selected) return;
      setSelectedId(null);
      router.push({pathname:'/qr',params:{eventId:selected.id,title:selected.title}});
    }} onMedals={()=>{setSelectedId(null);router.push('/medals');}}/>
  </ListScreen>;
}
const s = StyleSheet.create({ toolbar:{flexDirection:'row',justifyContent:'flex-end'},action:{minHeight:44,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:6},label:{color:colors.text,fontSize:12,fontFamily:'Montserrat_500Medium'} });
export function LiveEventQr() { return <InstitutionalAccess title="Registrar presença"><OrganizationEventQr /></InstitutionalAccess>; }
function OrganizationEventQr() {
  const { state, api } = useMock();
  const { eventId, title } = useLocalSearchParams<{ eventId: string; title?: string }>();
  const [permission] = useCameraPermissions();
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ medal_awarded: boolean } | null>(null);
  const router = useRouter();
  const submit = async (value: string) => {
    if (inFlight.current || result) return;
    inFlight.current = true; setBusy(true); setScanned(true); setError('');
    try {
      const response = await apiRequest(`/memberships/${state.membershipId}/events/${eventId}/checkin`, { method: 'POST', body: JSON.stringify({ code: value.trim() }) });
      setResult(response.data);
      void api.refresh().catch(() => {});
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível registrar a presença.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <Flow title={result ? 'Presença confirmada' : 'Ler QR Code'}>
    {!!title && <Copy>{title}</Copy>}
    {result ? <><Notice>Sua presença foi registrada.</Notice><Copy>{result.medal_awarded ? 'A conquista está disponível na sua coleção.' : 'Você já recebeu esta conquista anteriormente. Sua nova participação foi registrada.'}</Copy><Button title="Minhas medalhas" onPress={() => router.replace('/medals')}/><Button secondary title="Voltar aos eventos" onPress={() => router.replace('/events')}/></> : <>
      <Copy muted>Leia o QR Code disponível no local do evento. É necessário estar conectado.</Copy>
      {permission?.granted && focused && !scanned && <View style={{ height: 300, borderRadius: 16, overflow: 'hidden' }}><CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => { void submit(data); }} onMountError={() => { setScanned(true); setError('Não foi possível abrir a câmera. Você pode usar a entrada manual.'); }}/></View>}
      {!permission?.granted && <Button secondary title="Ajustar permissão da câmera" onPress={() => router.push('/permissions')}/ >}
      {!!error && <Notice>{error}</Notice>}
      {busy && <Copy muted>Validando presença…</Copy>}
      {scanned && !busy && <Button secondary title="Ler novamente" onPress={() => { setScanned(false); setError(''); }}/ >}
      <Field label="Código do evento (alternativa à câmera)" value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} editable={!busy}/>
      <Button secondary title="Validar código" disabled={busy || !code.trim()} onPress={() => { void submit(code); }}/>
    </>}
  </Flow>;
}
