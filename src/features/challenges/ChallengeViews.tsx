import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { Button, Card, Copy, Notice } from '@/ui/Flow';
import { Sheet } from '@/ui/Sheet';
import { MedalBadge } from '../MedalBadge';
import { canRegisterChallenge, challengeDate, challengeDeadline, challengePercent, challengeProgress, challengeStatus, type Challenge } from './model';

function LockedReward({ compact = false }: { compact?: boolean }) {
  return <View style={[s.lockedReward,compact&&s.compactReward]} accessible accessibilityLabel="Recompensa bloqueada. Conclua o desafio para revelar a medalha."><Icon name="gift" size={compact ? 26 : 36} color={colors.muted}/><View style={s.lock}><Icon name="lock" size={compact ? 12 : 16} color={colors.muted}/></View></View>;
}
function Progress({ challenge }: { challenge: Challenge }) {
  const percent = challengePercent(challenge);
  return <View style={s.progressBlock}>
    <View style={s.row}><Text style={s.progress}>{challengeProgress(challenge)}</Text><Text style={s.percent}>{Math.round(percent)}%</Text></View>
    <View style={s.track} accessibilityRole="progressbar" accessibilityLabel={`Progresso de ${challenge.title}`} accessibilityValue={{ min: 0, max: 100, now: percent }}><View style={[s.fill,{width:`${percent}%`}]}/></View>
  </View>;
}
export function ChallengeCard({ challenge, onPress }: { challenge: Challenge; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${challenge.title}. ${challengeStatus(challenge)}. ${challengeProgress(challenge)}. ${challengeDeadline(challenge)}. ${challenge.medal ? challenge.medal.earned ? 'Medalha conquistada.' : 'Recompensa bloqueada.' : ''} Ver detalhes.`} onPress={onPress} style={({pressed})=>[s.card,pressed&&{opacity:.75}]}>
    <View style={s.row}>
      <View style={{flex:1,gap:6}}><Text style={s.title} numberOfLines={2}>{challenge.title}</Text><Text style={[s.status,challenge.completed&&{color:colors.lime}]}>{challengeStatus(challenge)}</Text></View><Icon name="arrow" size={18}/>
    </View>
    <View style={s.row}>
      <View style={s.cardProgress}>
        <Progress challenge={challenge}/>
        <View style={s.deadline}><Icon name="clock" size={15} color={colors.muted}/><Text style={s.deadlineText}>{challengeDeadline(challenge)}</Text></View>
      </View>
      {challenge.medal && (challenge.medal.earned ? <MedalBadge imageUrl={challenge.medal.image_url} variant={challenge.medal.style} name={challenge.medal.name} size={48}/> : <LockedReward compact/>)}
    </View>
  </Pressable>;
}
export function ChallengeDetail({ challenge, onClose, onRegister, onMedals, hasDraft = false, illustrative = false }: { challenge?: Challenge; onClose: () => void; onRegister: () => void; onMedals?: () => void; hasDraft?: boolean; illustrative?: boolean }) {
  return <Sheet visible={!!challenge} title={challenge?.title ?? 'Desafio'} onClose={onClose}>
    {challenge && <>
      {illustrative && <Notice>Exemplo de meta diária. Não é um desafio publicado pela organização.</Notice>}
      <Text style={[s.status,challenge.completed&&{color:colors.lime}]}>{challengeStatus(challenge)}</Text>
      <Progress challenge={challenge}/>
      <Copy muted>{challengeDate(challenge.starts_on)} a {challengeDate(challenge.ends_on)}</Copy>
      {!!challenge.description && <Card title="Sobre o desafio"><Copy>{challenge.description}</Copy></Card>}
      <Card title="Como participar">
        <Copy>Objetivo: {challenge.target.toLocaleString('pt-BR')} {challenge.metric === 'minutes' ? challenge.target === 1 ? 'minuto' : 'minutos' : challenge.metric === 'activities' ? challenge.target === 1 ? 'atividade' : 'atividades' : 'EV'}.</Copy>
        <Copy>{challenge.activity_name ? `Atividade: ${challenge.activity_name}.` : 'Vale qualquer atividade elegível.'}</Copy>
        <Copy muted>{illustrative ? 'Atividades físicas e mentais somam para a mesma meta.' : 'Contam atividades aprovadas, com pontuação configurada, realizadas dentro do período do desafio.'}</Copy>
      </Card>
      {challenge.medal && <Card title="Recompensa">
        {challenge.medal.earned ? <>
          <MedalBadge imageUrl={challenge.medal.image_url} variant={challenge.medal.style} name={challenge.medal.name}/>
          <Text style={s.medalName}>{challenge.medal.name}</Text>
          {!!challenge.medal.description && <Copy>{challenge.medal.description}</Copy>}
        </> : <><LockedReward/><Copy muted>Conclua o desafio para revelar sua medalha.</Copy></>}
      </Card>}
      {canRegisterChallenge(challenge) ? <>
        {hasDraft && <Copy muted>Seu rascunho atual será preservado.</Copy>}
        <Button title={hasDraft ? 'Continuar meu registro' : 'Registrar atividade'} onPress={onRegister}/>
      </> : !challenge.completed && <Copy muted>{challenge.period_status === 'upcoming' ? 'O registro para este desafio começa no período indicado.' : 'O período deste desafio terminou.'}</Copy>}
      {challenge.medal?.earned && onMedals && <Button secondary title="Ver minhas medalhas" onPress={onMedals}/>}
    </>}
  </Sheet>;
}
const s=StyleSheet.create({cardProgress:{flex:1,minWidth:0,gap:10},lockedReward:{width:80,height:80,borderRadius:40,borderWidth:1,borderColor:colors.border,alignSelf:'center',alignItems:'center',justifyContent:'center',marginVertical:6},compactReward:{width:48,height:60,borderRadius:14,marginVertical:0},lock:{position:'absolute',bottom:3,right:3,backgroundColor:colors.surface,borderRadius:8,padding:2},card:{padding:16,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,gap:10},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},title:{flex:1,color:colors.text,fontFamily:'Montserrat_600SemiBold',fontSize:16,lineHeight:22},status:{color:colors.primary,fontFamily:'Montserrat_500Medium',fontSize:11},progressBlock:{gap:8},progress:{color:colors.text,fontFamily:'Montserrat_600SemiBold',fontSize:16},percent:{color:colors.muted,fontFamily:'Montserrat_500Medium',fontSize:12},track:{height:6,borderRadius:3,overflow:'hidden',backgroundColor:colors.border},fill:{height:'100%',backgroundColor:colors.lime},deadline:{flexDirection:'row',alignItems:'center',gap:6},deadlineText:{flex:1,color:colors.muted,fontFamily:'Montserrat_500Medium',fontSize:11,lineHeight:17},medalName:{color:colors.text,textAlign:'center',fontFamily:'Montserrat_600SemiBold',fontSize:17}});
