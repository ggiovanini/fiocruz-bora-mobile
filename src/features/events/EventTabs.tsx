import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/design/tokens';
export type EventTab = 'upcoming'|'ended'|'attended';
export function EventTabs({value,onChange}:{value:EventTab;onChange:(tab:EventTab)=>void}) {
  return <View style={s.tabs}>{([{id:'upcoming',label:'Próximos'},{id:'ended',label:'Encerrados'},{id:'attended',label:'Com presença'}] as const).map(tab=><Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{selected:value===tab.id}} onPress={()=>onChange(tab.id)} style={s.tab}><Text style={[s.text,value===tab.id&&s.selected]}>{tab.label}</Text></Pressable>)}</View>;
}
export const eventEmptyCopy={upcoming:{title:'Novos encontros vêm aí',body:'Nenhum evento próximo ou em andamento no momento.'},ended:{title:'Nenhum evento encerrado',body:'Os eventos que terminarem aparecerão aqui.'},attended:{title:'Seus encontros ficam aqui',body:'Você ainda não confirmou presença em nenhum evento.'}};
const s=StyleSheet.create({tabs:{flexDirection:'row',flexWrap:'wrap',gap:20},tab:{minHeight:44,justifyContent:'center'},text:{color:colors.muted,fontFamily:'Montserrat_500Medium',fontSize:14},selected:{color:colors.primary,fontFamily:'Montserrat_700Bold'}});
