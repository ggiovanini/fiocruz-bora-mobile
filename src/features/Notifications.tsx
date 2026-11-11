import {useNotifications} from '@/notifications/NotificationProvider';
import {useRouter, useFocusEffect} from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/api/session';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { ListScreen } from '@/ui/ListScreen';
import { Button, Copy, Notice } from '@/ui/Flow';
import { MessageRow, type Message } from './notifications/MessageRow';
export default function Notifications() {
  const inbox = useNotifications();
  const router = useRouter();
  const [items, setItems] = useState<Message[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [changing,setChanging]=useState<string | null>(null);
  const [removedId,setRemovedId]=useState<string | null>(null);
  const mutation=useRef(false);
  const sequence=useRef(0);
  useFocusEffect(useCallback(()=>{setPage(1);setAttempt(value=>value+1);void inbox.refresh();},[inbox.refresh]));
  useEffect(()=>{setPage(1);setAttempt(value=>value+1);},[inbox.unread]);
  useEffect(() => {
    let current = true;
    const token=++sequence.current;
    setBusy(true); setError('');
    apiRequest(`/me/notifications?page=${page}`).then(result => {
      if (!current || token!==sequence.current) return;
      setItems(previous => [...new Map((page === 1 ? result.data : [...previous, ...result.data]).map((item: Message) => [item.id, item])).values()] as Message[]);
      setHasMore(result.current_page < result.last_page);
    }).catch(error => { if (current && token===sequence.current) setError(error.message); }).finally(() => { if (current && token===sequence.current) setBusy(false); });
    return () => { current = false; };
  }, [page, attempt]);
  async function change(item:Message | string,action:'read' | 'dismiss' | 'restore') {
    if(mutation.current)return;
    const id=typeof item==='string' ? item : item.id;
    if(action==='read' && typeof item!=='string' && item.read_at)return;
    mutation.current=true;setChanging(id);setError('');
    try {
      await apiRequest(`/me/notifications/${encodeURIComponent(id)}${action==='dismiss' ? '' : `/${action}`}`,{method:action==='dismiss' ? 'DELETE' : 'PATCH'});
      sequence.current++;
      setBusy(false);
      if(action==='dismiss') {setItems(previous=>previous.filter(row=>row.id!==id));setRemovedId(id);}
      if(action==='read')setItems(previous=>previous.map(row=>row.id===id ? {...row,read_at:new Date().toISOString()} : row));
      if(action==='restore')setRemovedId(null);
      setPage(1);setAttempt(value=>value+1);void inbox.refresh();
    } catch(failure) {setError(failure instanceof Error ? failure.message : 'Não foi possível atualizar a mensagem.');}
    finally {mutation.current=false;setChanging(null);}
  }
  return <ListScreen title="Notificações" icon="bell">
    <View style={s.toolbar}>
      <Text style={s.unread}>{inbox.unread ? `${inbox.unread} ${inbox.unread===1 ? 'não lida' : 'não lidas'}` : 'Todas lidas'}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Atualizar mensagens" accessibilityState={{disabled:busy || !!changing,busy}} disabled={busy || !!changing} style={[s.action,busy&&{opacity:.5}]} onPress={()=>{setPage(1);setAttempt(value=>value+1);void inbox.refresh();}}><Icon name="clock" size={20}/></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Preferências de avisos do aparelho" style={s.action} onPress={()=>router.push('/notification-settings')}><Icon name="settings" size={20}/><Text style={s.actionText}>Avisos</Text></Pressable>
    </View>

    {!!error && <Notice>{error}</Notice>}
    {!busy && !error && !items.length && <Copy>Você ainda não tem notificações.</Copy>}
    {removedId && <View style={s.undo}><Text style={s.unread}>Mensagem removida.</Text><Pressable accessibilityRole="button" accessibilityLabel="Desfazer remoção da mensagem" disabled={!!changing} onPress={()=>{void change(removedId,'restore');}} style={s.action}><Text style={s.undoText}>Desfazer</Text></Pressable></View>}
    {items.map(item=><MessageRow key={item.id} message={item} busy={!!changing} onRead={()=>{void change(item,'read');}} onDismiss={()=>change(item,'dismiss')}/>)}
    {hasMore && <Button secondary title="Carregar mais" disabled={busy || !!changing} onPress={() => setPage(value => value + 1)} />}
    {busy && <Copy muted>Carregando…</Copy>}
    {!!error && <Button title="Tentar novamente" disabled={busy || !!changing} onPress={() => setAttempt(value => value + 1)} />}
  </ListScreen>;
}

const s=StyleSheet.create({undo:{flexDirection:'row',alignItems:'center',gap:12,paddingLeft:12,borderRadius:14,backgroundColor:colors.accent},undoText:{color:colors.primary,fontFamily:'Montserrat_600SemiBold',fontSize:12},toolbar:{flexDirection:'row',alignItems:'center',gap:12},unread:{flex:1,color:colors.muted,fontFamily:'Montserrat_500Medium',fontSize:12},action:{minHeight:44,minWidth:44,paddingHorizontal:6,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},actionText:{color:colors.text,fontFamily:'Montserrat_500Medium',fontSize:12}});
