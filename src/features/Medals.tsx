import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { usePagedResource } from '@/api/usePagedResource';
import { Button, Card, Copy, Notice } from '@/ui/Flow';
import { ListScreen } from '@/ui/ListScreen';
import { Sheet } from '@/ui/Sheet';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { MedalBadge } from './MedalBadge';

type MedalEntry = { id: string; challenge_title: string | null; event_title?: string | null; awarded_at: string };
type Medal = { id: string; name: string; description: string; style: string; image_url?: string | null; challenge_title: string | null; event_title?: string | null; awarded_at: string; count: number; history: MedalEntry[] };
const date = (value: string) => new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z').toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

export default function Medals() {
  const { width,fontScale } = useWindowDimensions();
  const [search,setSearch] = useState('');
  const [query,setQuery] = useState('');
  const [selectedId,setSelectedId] = useState<string | null>(null);
  const { items,busy,error,more,loadMore,refresh } = usePagedResource<Medal>(`/me/medals${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  const selected=items.find(medal=>medal.id===selectedId);
  const columns=width < 360 || fontScale > 1.4 ? 1 : 2;
  return <ListScreen title="Minhas medalhas" icon="trophy" search={{value:search,onChangeText:setSearch,onSubmit:()=>{setSelectedId(null);setQuery(search.trim());},activeQuery:query,onClear:()=>{setSelectedId(null);setSearch('');setQuery('');},placeholder:'Nome ou descrição'}}>
    {!!error && <Notice>{error}</Notice>}
    {!busy && !error && !items.length && <Card title={query ? 'Nenhuma medalha encontrada' : 'Sua coleção começa com uma conquista'}><Copy>{query ? 'Tente outro termo ou limpe a busca.' : 'Conclua um desafio ou participe de um evento para receber sua primeira medalha digital.'}</Copy></Card>}
    <View style={s.grid}>
      {items.map(medal=><View key={medal.id} style={[s.cell,{width:columns===2 ? '50%' : '100%'}]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${medal.name}. Conquistada ${medal.count} ${medal.count===1 ? 'vez' : 'vezes'}. Ver detalhes.`} onPress={()=>setSelectedId(medal.id)} style={({pressed})=>[s.tile,pressed&&{opacity:.75}]}>
          {medal.count>1 && <View style={s.count}><Text style={s.countText}>×{medal.count}</Text></View>}
          <MedalBadge imageUrl={medal.image_url} variant={medal.style} name={medal.name} size={88}/>
          <Text style={s.name} numberOfLines={2}>{medal.name}</Text>
        </Pressable>
      </View>)}
    </View>
    {busy && <Copy muted>Carregando medalhas…</Copy>}
    {more && <Button secondary title="Carregar mais medalhas" disabled={busy} onPress={loadMore}/>}
    {!!error && <Button title="Tentar novamente" disabled={busy} onPress={refresh}/>}
    <Sheet visible={!!selected} title={selected?.name ?? 'Medalha'} onClose={()=>setSelectedId(null)}>
      {selected && <>
        <MedalBadge imageUrl={selected.image_url} variant={selected.style} name={selected.name} size={128}/>
        {!!selected.description && <Copy>{selected.description}</Copy>}
        {selected.count>1 && <Copy muted>{selected.count} conquistas</Copy>}
        <Card title={selected.count>1 ? 'Histórico de conquistas' : 'Sua conquista'}>
          {selected.history?.length ? selected.history.map(entry=><View key={entry.id} style={s.historyRow}>
            <Icon name={entry.event_title ? 'calendar' : entry.challenge_title ? 'target' : 'trophy'} size={20}/>
            <View style={s.historyText}><Text style={s.historyTitle}>{entry.event_title || entry.challenge_title || 'Conquista'}</Text><Text style={s.date}>{date(entry.awarded_at)}</Text></View>
          </View>) : <Copy muted>Conquistada em {date(selected.awarded_at)}</Copy>}
        </Card>
      </>}
    </Sheet>
  </ListScreen>;
}
const s=StyleSheet.create({
  grid:{flexDirection:'row',flexWrap:'wrap',marginHorizontal:-6,marginVertical:-6},
  cell:{padding:6},
  tile:{flex:1,alignItems:'center',justifyContent:'center',gap:12,padding:16,borderRadius:20,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  name:{minHeight:40,color:colors.text,fontFamily:'Montserrat_600SemiBold',fontSize:13,lineHeight:20,textAlign:'center'},
  count:{position:'absolute',top:10,right:10,borderRadius:10,paddingHorizontal:7,paddingVertical:3,backgroundColor:colors.accent},
  countText:{color:colors.primary,fontFamily:'Montserrat_600SemiBold',fontSize:10},
  historyRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:8},
  historyText:{flex:1,gap:4},
  historyTitle:{color:colors.text,fontFamily:'Montserrat_500Medium',fontSize:13,lineHeight:20},
  date:{color:colors.muted,fontFamily:'Montserrat_400Regular',fontSize:12,lineHeight:18},
});
