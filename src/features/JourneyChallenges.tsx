import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Flow, Copy, Button } from '@/ui/Flow';
import { ActionRow } from '@/components/ActivityUI';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { useEnergyPreview } from './avatar/EnergyPreview';
import { dailyEnergy } from './avatar/energy';
export default function JourneyChallenges() {
  const router = useRouter();
  const { energy, goal } = useEnergyPreview();
  const daily = dailyEnergy(energy.green,energy.blue,goal);
  return <Flow title="Pequenos passos. Uma jornada." back={false}>
    <Copy muted>Seus desafios acompanham a Energia Vital. Você escolhe a combinação de movimento e mente.</Copy>
    <View style={s.card}>
      <View style={s.top}><Text style={s.eyebrow}>SEU DESAFIO DE HOJE</Text><Icon name="target" color={colors.lime}/></View>
      <Text style={s.value}>{goal}<Text style={s.unit}> EV</Text></Text>
      <Text style={s.title}>No seu ritmo, do seu jeito.</Text>
      <View style={s.track}><View style={{width:`${daily.greenProgress}%`,backgroundColor:colors.lime}}/><View style={{width:`${daily.blueProgress}%`,backgroundColor:colors.primary}}/></View>
      <Text style={s.description}>{daily.total} de {goal} EV · {daily.complete?'Meta alcançada':`${daily.remaining} EV para completar`}</Text>
      <Text style={s.description}>Vale uma caminhada, uma leitura ou a união das duas. As cores contribuem para a mesma meta.</Text>
      <Button title="Adicionar uma atividade" onPress={() => router.push('/activity')}/>
      <Pressable accessibilityRole="button" onPress={() => router.push('/avatar-lab')} style={s.link}><Text style={s.linkText}>Ajustar meta da prévia</Text></Pressable>
    </View>
    <Text style={s.section}>Encontre seu próximo momento</Text>
    <ActionRow icon="activity" title="Movimentar o corpo" description="Escolha uma atividade que cabe no seu dia." color={colors.lime} onPress={() => router.push('/activity')}/>
    <ActionRow icon="book" title="Abrir espaço para a mente" description="Explore leituras e conteúdos de bem-estar." onPress={() => router.push('/content')}/>
    <Copy muted>Meta e EV ilustrativos. Os desafios com prazo, constância e recompensas serão publicados com as regras da campanha.</Copy>
  </Flow>;
}
const s=StyleSheet.create({card:{padding:24,borderRadius:24,borderWidth:1,borderColor:colors.border,gap:16,backgroundColor:colors.surface},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},eyebrow:{fontFamily:'Montserrat_500Medium',fontSize:9,letterSpacing:1.5,color:colors.lime},value:{fontFamily:'Montserrat_700Bold',fontSize:54,color:colors.text},unit:{fontSize:18,color:colors.muted},title:{fontFamily:'Montserrat_600SemiBold',fontSize:19,color:colors.text},track:{height:5,borderRadius:3,overflow:'hidden',backgroundColor:colors.border,flexDirection:'row'},description:{fontFamily:'Montserrat_400Regular',fontSize:12,lineHeight:20,color:colors.muted},link:{alignItems:'center',justifyContent:'center',minHeight:44},linkText:{fontFamily:'Montserrat_500Medium',color:colors.primary,fontSize:12},section:{fontFamily:'Montserrat_600SemiBold',fontSize:16,color:colors.text,marginTop:10}});
