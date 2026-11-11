import MonthlyTeamRanking from './MonthlyTeamRanking';
import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { apiEnabled } from '@/api/session';
import { Copy } from '@/ui/Flow';
import { ListScreen } from '@/ui/ListScreen';
import { Sheet } from '@/ui/Sheet';
import { RankingToolbar } from './RankingToolbar';
import { colors } from '@/design/tokens';
import { Icon } from '@/design/Icon';
export default function JourneyRanking() { return apiEnabled ? <MonthlyTeamRanking/> : <PreviewRanking/>; }
function PreviewRanking() {
  const [about,setAbout] = useState(false);
  return <ListScreen title="Ranking" icon="trophy" back={false}>
    <RankingToolbar onAbout={()=>setAbout(true)}/>
    <Copy>Ranking geral mensal de equipes</Copy>
    <Sheet visible={about} title="Como funciona o ranking" onClose={()=>setAbout(false)}><Copy>O ranking coletivo usa a média de EV por participante ativo. Atividades físicas e mentais contribuem para a mesma pontuação.</Copy><Copy muted>Resultados são agregados. Grupos com menos de 5 participantes não são exibidos e gestores não têm acesso às suas atividades individuais.</Copy><Copy muted>Períodos e pontuações oficiais serão definidos para a campanha.</Copy></Sheet>
      <View style={s.caption}><Text style={s.eyebrow}>EQUIPES</Text><Text style={s.eyebrow}>EV MÉDIA</Text></View>
      {['Equipe A','Sua equipe','Equipe C'].map((team,i)=><View key={team} style={[s.row,i===1&&s.mine]}><Text style={s.position}>{String(i+1).padStart(2,'0')}</Text><View style={s.avatar}><Icon name="trophy" color={i===1?colors.lime:colors.primary} size={22}/></View><View style={s.name}><Text style={s.title}>{team}</Text><View style={[s.badge,i===1&&s.memberBadge]}><Text style={[s.badgeText,i===1&&s.memberBadgeText]}>{i===1?'Você participa':'Você não participa'}</Text></View></View><Text style={s.score}>—</Text></View>)}
      <Copy muted>Classificação com dados de exemplo.</Copy>
  </ListScreen>;
}
const s=StyleSheet.create({badge:{alignSelf:'flex-start',paddingHorizontal:8,paddingVertical:4,borderRadius:8,backgroundColor:colors.surface},memberBadge:{backgroundColor:'#173F35'},badgeText:{fontFamily:'Montserrat_500Medium',fontSize:10,lineHeight:15,color:colors.muted},memberBadgeText:{color:colors.lime},caption:{flexDirection:'row',justifyContent:'space-between',marginTop:24,paddingBottom:8},eyebrow:{color:colors.muted,fontFamily:'Montserrat_500Medium',fontSize:9,letterSpacing:1.4},row:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:22,borderBottomWidth:1,borderBottomColor:colors.border},mine:{backgroundColor:'#07364D',marginHorizontal:-12,paddingHorizontal:12,borderRadius:14},position:{fontFamily:'Montserrat_500Medium',color:colors.primary,fontSize:13},avatar:{height:42,width:42,borderRadius:21,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},name:{flex:1,gap:7},title:{fontFamily:'Montserrat_600SemiBold',fontSize:14,color:colors.text},subtitle:{fontFamily:'Montserrat_400Regular',fontSize:10,color:colors.muted},score:{fontFamily:'Montserrat_600SemiBold',color:colors.primary,fontSize:22}});
