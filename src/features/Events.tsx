import { useState, useRef, useCallback } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image, Linking, View } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { apiRequest } from '@/api/session';
import { usePagedResource } from '@/api/usePagedResource';
import { useMock } from '@/mocks/MockProvider';
import { Button, Card, Copy, Field, Flow, Notice } from '@/ui/Flow';
import { MedalBadge } from './MedalBadge';
type Event = { image_url?: string | null; id: string; title: string; description: string; location: string; qr_instructions: string; starts_at: string; ends_at: string; active: boolean; checked_in: boolean; medal: { name: string; style: string; image_url?: string | null } };
const date = (value: string) => new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
function EventCover({uri,title}: {uri?: string | null;title:string}) {
  const [failed,setFailed] = useState(false);
  if (!uri || failed) return null;
  return <Image source={{uri}} accessibilityLabel={`Imagem do evento ${title}`} style={{width:'100%',aspectRatio:16/9,borderRadius:12}} resizeMode="cover" onError={()=>setFailed(true)}/>;
}
export function LiveEvents() {
  const { state } = useMock();
  const router = useRouter();
  const { items, busy, error, more, refresh, loadMore } = usePagedResource<Event>(`/memberships/${state.membershipId}/events`);
  return <Flow title="Eventos">
    <Copy muted>Encontre seu próximo encontro e saiba onde registrar sua presença.</Copy>
    {!!error && <Notice>{error}</Notice>}
    {busy && <Copy muted>Carregando eventos…</Copy>}
    {!busy && !error && !items.length && <Card title="Novos encontros vêm aí"><Copy>Nenhum evento publicado para sua organização no momento.</Copy></Card>}
    {items.map(event => <Card key={event.id} title={event.title}>
      <EventCover uri={event.image_url} title={event.title}/><Copy>{event.description}</Copy><Copy muted>{date(event.starts_at)} – {date(event.ends_at)} · Horário de Brasília</Copy><Copy>{event.location}</Copy>
      <MedalBadge name={event.medal.name} variant={event.medal.style} imageUrl={event.medal.image_url} earned={event.checked_in}/><Copy>{event.medal.name}</Copy>
      <Copy>Onde encontrar o QR Code: {event.qr_instructions}</Copy>
      {event.checked_in ? <Notice>Presença confirmada.</Notice> : event.active ? <Button title="Registrar presença por QR Code" onPress={() => router.push({ pathname: '/qr', params: { eventId: event.id, title: event.title } })}/> : <Copy muted>A leitura fica disponível durante o período do evento.</Copy>}
    </Card>)}
    {more && <Button secondary title="Carregar mais eventos" disabled={busy} onPress={loadMore}/>}
    {!!error && <Button title="Tentar novamente" disabled={busy} onPress={refresh}/>}
  </Flow>;
}
export function LiveEventQr() {
  const { state } = useMock();
  const { eventId, title } = useLocalSearchParams<{ eventId: string; title?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
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
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível registrar a presença.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <Flow title={result ? 'Presença confirmada' : 'Ler QR Code'}>
    {!!title && <Copy>{title}</Copy>}
    {result ? <><Notice>Sua presença foi registrada.</Notice><Copy>{result.medal_awarded ? 'A conquista está disponível na sua coleção.' : 'Você já recebeu esta conquista anteriormente. Sua nova participação foi registrada.'}</Copy><Button title="Minhas medalhas" onPress={() => router.replace('/medals')}/><Button secondary title="Voltar aos eventos" onPress={() => router.replace('/events')}/></> : <>
      <Copy muted>Leia o QR Code disponível no local do evento. É necessário estar conectado.</Copy>
      {permission?.granted && focused && !scanned && <View style={{ height: 300, borderRadius: 16, overflow: 'hidden' }}><CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => { void submit(data); }} onMountError={() => { setScanned(true); setError('Não foi possível abrir a câmera. Você pode usar a entrada manual.'); }}/></View>}
      {!permission?.granted && <Button secondary title={permission?.canAskAgain === false ? 'Abrir ajustes da câmera' : 'Permitir acesso à câmera'} onPress={() => { if(permission?.canAskAgain === false) void Linking.openSettings(); else void requestPermission(); }}/ >}
      {!!error && <Notice>{error}</Notice>}
      {busy && <Copy muted>Validando presença…</Copy>}
      {scanned && !busy && <Button secondary title="Ler novamente" onPress={() => { setScanned(false); setError(''); }}/ >}
      <Field label="Código do evento (alternativa à câmera)" value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} editable={!busy}/>
      <Button secondary title="Validar código" disabled={busy || !code.trim()} onPress={() => { void submit(code); }}/>
    </>}
  </Flow>;
}
