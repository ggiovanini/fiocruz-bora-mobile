import {useNotifications} from '@/notifications/NotificationProvider';
import {useFocusEffect} from 'expo-router';
import {useCallback} from 'react';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/api/session';
import { Button, Card, Copy, Flow, Notice } from '@/ui/Flow';
type Message = { id: string; title: string; body: string; read_at: string | null };
export default function Notifications() {
  const inbox = useNotifications();
  const [items, setItems] = useState<Message[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(()=>{setPage(1);setAttempt(value=>value+1);void inbox.refresh();},[inbox.refresh]));
  useEffect(()=>{setPage(1);setAttempt(value=>value+1);},[inbox.unread]);
  useEffect(() => {
    let current = true;
    setBusy(true); setError('');
    apiRequest(`/me/notifications?page=${page}`).then(result => {
      if (!current) return;
      setItems(previous => [...new Map((page === 1 ? result.data : [...previous, ...result.data]).map((item: Message) => [item.id, item])).values()] as Message[]);
      setHasMore(result.current_page < result.last_page);
    }).catch(error => { if (current) setError(error.message); }).finally(() => { if (current) setBusy(false); });
    return () => { current = false; };
  }, [page, attempt]);
  return <Flow title="Minhas notificações">
    <Copy>{inbox.unread} mensagem(ns) não lida(s)</Copy>
    <Button secondary title="Atualizar mensagens" disabled={busy} onPress={()=>{setPage(1);setAttempt(value=>value+1);void inbox.refresh();}} />
    <Card title="Avisos do aparelho">
      <Copy muted>Com o app em uso, verificamos novas mensagens a cada 30 segundos e ao voltar para ele. Com o app fechado, os avisos ainda não estão disponíveis.</Copy>
      <Button secondary title={inbox.enabled?'Desativar avisos neste aparelho':'Permitir avisos neste aparelho'} onPress={()=>void (inbox.enabled?inbox.disable():inbox.enable())} />
      {inbox.enabled && <Button secondary title="Testar aviso do sistema" onPress={()=>void inbox.test()} />}
      {!!inbox.error && <Notice>{inbox.error}</Notice>}
    </Card>
    {!!error && <Notice>{error}</Notice>}
    {!busy && !error && !items.length && <Copy>Você ainda não tem notificações.</Copy>}
    {items.map(item => <Card key={item.id} title={item.title}>
      <Copy>{item.body}</Copy>
      {!item.read_at && <Button secondary title="Marcar como lida" onPress={async () => {
        try {
          await apiRequest(`/me/notifications/${item.id}/read`, { method: 'PATCH' });
          setItems(previous => previous.map(row => row.id === item.id ? { ...row, read_at: new Date().toISOString() } : row));
          void inbox.refresh();
        } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível atualizar.'); }
      }} />}
    </Card>)}
    {hasMore && <Button secondary title="Carregar mais" disabled={busy} onPress={() => setPage(value => value + 1)} />}
    {busy && <Copy muted>Carregando…</Copy>}
    {!!error && <Button title="Tentar novamente" onPress={() => setAttempt(value => value + 1)} />}
  </Flow>;
}
