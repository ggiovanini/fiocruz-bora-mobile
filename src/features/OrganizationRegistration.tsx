import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { uuid } from '@/api/activityMapping';
import { apiRequest } from '@/api/session';
import { useMock } from '@/mocks/MockProvider';
import { Button, Card, Copy, Field, Flow, Notice } from '@/ui/Flow';

type Organization = { id: string; name: string };
export function OrganizationChoice() {
  const { api } = useMock();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Organization[]>([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [selected, setSelected] = useState<Organization | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const operation = useRef({ organization: '', key: '' });
  const sequence = useRef(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; sequence.current++; }; }, []);
  const load = async (next = 1) => {
    const token = ++sequence.current;
    setLoading(true); setError('');
    try {
      const result = await apiRequest(`/registration/organizations?q=${encodeURIComponent(query.trim())}&page=${next}`);
      if (!mounted.current || token !== sequence.current) return;
      setItems(previous => next === 1 ? result.data : [...previous, ...result.data]);
      setPage(next); setMore(result.current_page < result.last_page);
    } catch (failure) {
      if (mounted.current && token === sequence.current) setError(failure instanceof Error ? failure.message : 'Não foi possível carregar as organizações.');
    } finally { if (mounted.current && token === sequence.current) setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const act = async (operation: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true); setError('');
    try { await operation(); await api.refresh(); setSelected(null); }
    catch (failure) { if (mounted.current) setError(failure instanceof Error ? failure.message : 'Não foi possível salvar.'); }
    finally { if (mounted.current) setBusy(false); }
  };
  const pending = api.data.registrations.find(item => item.status === 'pending');
  const latest = [...api.data.registrations].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  return <>
    <Copy>De qual organização você faz parte? Escolha abaixo. Depois, alguém de lá confirma sua participação — e você já pode começar sua jornada.</Copy>
    {!!error && <Notice>{error}</Notice>}
    {pending ? <Card title="Só falta uma confirmação">
      <Copy>{pending.organization_name}</Copy>
      <Copy muted>Alguém da sua organização vai conferir sua participação. Enquanto isso, suas atividades e sua evolução continuam por aqui.</Copy>
      <Button secondary title="Escolhi outra. Quero corrigir" disabled={busy || api.busy} onPress={() => { void act(() => apiRequest(`/me/organization-requests/${pending.id}`, { method: 'DELETE' })); }} />
      <Button secondary title="Ver se já foi confirmado" disabled={busy || api.busy} onPress={() => { void act(() => Promise.resolve()); }} />
    </Card> : <>
      {latest?.status === 'rejected' && <Notice>Não conseguimos confirmar sua participação em {latest.organization_name}. Está tudo bem: sua jornada continua salva. Você pode escolher outra organização ou falar com a gente.</Notice>}
      {api.data.memberships.length > 0 && <Card title="Você já faz parte">{api.data.memberships.map(item => <Copy key={item.id}>{item.organization_name}</Copy>)}</Card>}
      <Field label="Buscar organização" value={query} onChangeText={setQuery} maxLength={100} autoCorrect={false} />
      <Button secondary title="Buscar" disabled={busy || loading} onPress={() => { setSelected(null); void load(); }} />
      {loading && <Copy muted>Carregando organizações…</Copy>}
      {!loading && !items.length && <Copy>Nenhuma organização encontrada.</Copy>}
      {items.map(item => <Button key={item.id} secondary={selected?.id !== item.id} title={item.name} disabled={busy || loading || api.data.memberships.some(member => member.organization_id === item.id)} onPress={() => { if (operation.current.organization !== item.id) operation.current = { organization: item.id, key: uuid() }; setSelected(item); }} />)}
      {more && <Button secondary title="Ver mais organizações" disabled={busy || loading} onPress={() => { void load(page + 1); }} />}
      {selected && <Card title="Confirmar escolha"><Copy>{selected.name}</Copy><Copy muted>Vamos pedir a alguém dessa organização para confirmar sua participação. As atividades que você já fez continuam na sua jornada pessoal.</Copy><Button title="É essa! Continuar" disabled={busy || api.busy} onPress={() => { void act(() => apiRequest('/me/organization-requests', { method: 'POST', body: JSON.stringify({ organization_id: selected.id, operation_key: operation.current.key }) })); }} /></Card>}
      {!api.data.profile?.organization_selection_completed_at && <Button secondary title="Não encontrei. Quero começar mesmo assim" disabled={busy || api.busy} onPress={() => { void act(() => apiRequest('/me/organization-selection', { method: 'PUT' })); }} />}
    </>}
  </>;
}

export default function OrganizationRegistration() {
  const router = useRouter();
  return <Flow title="Minha organização"><OrganizationChoice /><Button secondary title="Voltar à jornada" onPress={() => router.back()} /></Flow>;
}
