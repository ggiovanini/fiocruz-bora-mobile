import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { Copy, Flow } from '@/ui/Flow';
import { Chip, activityStyles } from '@/components/ActivityUI';
import { colors } from '@/design/tokens';
import { Icon } from '@/design/Icon';
export default function JourneyRanking() {
  const [about,setAbout] = useState(false);
  return <Flow title="Juntos, vamos mais longe." back={false}>
    <View style={activityStyles.chips}><Chip label="Equipes" selected={!about} onPress={()=>setAbout(false)}/><Chip label="Como funciona" selected={about} onPress={()=>setAbout(true)}/></View>
    {about ? <><Copy>O ranking coletivo usa a média de EV por participante ativo. Verde e azul contribuem para a mesma pontuação.</Copy><Copy muted>Resultados são agregados. Grupos com menos de 10 participantes não são exibidos e gestores não têm acesso às suas atividades individuais.</Copy><Copy muted>Períodos e pontuações oficiais serão definidos para a campanha.</Copy></> : <>
      <View style={s.caption}><Text style={s.eyebrow}>PRÉVIA · EQUIPES</Text><Text style={s.eyebrow}>EV MÉDIA</Text></View>
      {['Equipe A','Sua equipe','Equipe C'].map((team,i)=><View key={team} style={[s.row,i===1&&s.mine]}><Text style={s.position}>{String(i+1).padStart(2,'0')}</Text><View style={s.avatar}><Icon name="trophy" color={i===1?colors.lime:colors.primary} size={22}/></View><View style={s.name}><Text style={s.title}>{team}</Text><Text style={s.subtitle}>{i===1?'É bom ter você por aqui.':'Uma jornada compartilhada.'}</Text></View><Text style={s.score}>—</Text></View>)}
      <Copy muted>Posições ilustrativas. O ranking será atualizado com dados agregados e validados da campanha.</Copy>
    </>}
  </Flow>;
}
const s=StyleSheet.create({caption:{flexDirection:'row',justifyContent:'space-between',marginTop:24,paddingBottom:8},eyebrow:{color:colors.muted,fontFamily:'Montserrat_500Medium',fontSize:9,letterSpacing:1.4},row:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:22,borderBottomWidth:1,borderBottomColor:colors.border},mine:{backgroundColor:'#07364D',marginHorizontal:-12,paddingHorizontal:12,borderRadius:14},position:{fontFamily:'Montserrat_500Medium',color:colors.primary,fontSize:13},avatar:{height:42,width:42,borderRadius:21,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},name:{flex:1,gap:7},title:{fontFamily:'Montserrat_600SemiBold',fontSize:14,color:colors.text},subtitle:{fontFamily:'Montserrat_400Regular',fontSize:10,color:colors.muted},score:{fontFamily:'Montserrat_600SemiBold',color:colors.primary,fontSize:22}});
