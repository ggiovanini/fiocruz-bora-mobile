import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { apiEnabled } from '@/api/session';
import { useMock } from '@/mocks/MockProvider';
import { activityTitle, newDraft, type Activity } from '@/mocks/model';
import { Icon, type IconName } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { ListScreen } from '@/ui/ListScreen';
import { Button, Copy, Notice } from '@/ui/Flow';
import { HistoryCard, HistoryDetail } from './HistoryViews';
import { useHistorySearch } from './useHistorySearch';
const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
function Action({icon,label,onPress,disabled=false}:{icon:IconName;label:string;onPress:()=>void;disabled?:boolean}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={[s.action,disabled&&{opacity:.5}]}><Icon name={icon} size={21}/><Text style={s.actionText}>{label}</Text></Pressable>;
}
export default function History() {
  const {state,dispatch,api,send}=useMock();
  const router=useRouter();
  const [search,setSearch]=useState('');
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState<Activity | null>(null);
  const [retrying,setRetrying]=useState(false);
  const [retryError,setRetryError]=useState('');
  const retryLock=useRef(false);
  const found=useHistorySearch(query,state.userId);
  const cached=state.activities.filter(item=>normalize(activityTitle(item)).includes(normalize(query)));
  const offlineSearch=apiEnabled && !!query && (!!found.error || state.offline);
  const localQueue=cached.filter(item=>item.status!=='confirmed');
  const items=query && apiEnabled && !offlineSearch ? [...new Map([...localQueue,...found.items].map(item=>[item.id,item])).values()].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt)) : cached;
  const detail=selected ? items.find(item=>item.id===selected.id) ?? state.activities.find(item=>item.id===selected.id) ?? selected : undefined;
  const busy=query && apiEnabled ? found.busy : api.busy;
  function register() {if(!state.draft)dispatch({type:'draft',value:newDraft()});router.push('/activity');}
  async function retry() {
    if(!detail || retryLock.current)return;
    retryLock.current=true;setRetrying(true);setRetryError('');
    try {await send(detail);if(query)found.refresh();}
    catch(failure){setRetryError(failure instanceof Error ? failure.message : 'Não foi possível reenviar.');}
    finally {retryLock.current=false;setRetrying(false);}
  }
  return <ListScreen title="Minhas atividades" icon="activity" search={{value:search,onChangeText:setSearch,onSubmit:()=>{setSelected(null);setQuery(search.trim());},activeQuery:query,onClear:()=>{setSearch('');setQuery('');setSelected(null);},placeholder:'Nome da atividade'}}>
    <View style={s.toolbar}>
      <Action icon="plus" label={state.draft ? 'Continuar' : 'Registrar'} onPress={register}/>
      <Action icon="phone" label="Do aparelho" onPress={()=>router.push('/health')}/>
      {apiEnabled && <Action icon="clock" label="Atualizar" disabled={busy} onPress={()=>{if(query)found.refresh();else void api.refresh().catch(()=>{});}}/>}
    </View>
    {state.draft && <Pressable accessibilityRole="button" accessibilityLabel={`Continuar rascunho: ${activityTitle(state.draft)}`} onPress={()=>router.push('/activity')} style={s.draft}><Icon name="edit" size={18}/><Text style={s.draftText}>Rascunho · {activityTitle(state.draft)}</Text><Icon name="arrow" size={17}/></Pressable>}
    {!!query && !!found.error && <><Notice>{found.error}</Notice><Button secondary title="Tentar pesquisa novamente" disabled={found.busy} onPress={found.refresh}/></>}
    {offlineSearch && <Copy muted>Exibindo atividades salvas neste aparelho.</Copy>}
    {!busy && !items.length && <Copy muted>{query ? 'Nenhuma atividade encontrada. Tente outro nome ou limpe a busca.' : 'Nenhuma atividade registrada ainda.'}</Copy>}
    {items.map(activity=><HistoryCard key={activity.id} activity={activity} live={apiEnabled} onPress={()=>{setRetryError('');setSelected(activity);}}/>)}
    {busy && <Copy muted>Carregando atividades…</Copy>}
    {(query && apiEnabled ? found.more : apiEnabled && api.data.nextCursor) && <Button secondary title="Carregar mais atividades" disabled={busy} onPress={()=>{if(query)found.loadMore();else void api.loadMore().catch(()=>{});}}/>}
    <HistoryDetail activity={detail} live={apiEnabled} offline={state.offline} busy={retrying} error={retryError} canRetry={!apiEnabled || (!!detail?.apiPayload && detail.membershipId===state.membershipId && state.accepted)} onClose={()=>setSelected(null)} onRetry={()=>{void retry();}}/>
  </ListScreen>;
}
const s=StyleSheet.create({toolbar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},action:{minHeight:44,flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:3},actionText:{color:colors.text,fontFamily:'Montserrat_500Medium',fontSize:11},draft:{flexDirection:'row',alignItems:'center',gap:10,padding:12,borderRadius:14,backgroundColor:colors.surface},draftText:{flex:1,color:colors.muted,fontFamily:'Montserrat_500Medium',fontSize:12,lineHeight:18}});
