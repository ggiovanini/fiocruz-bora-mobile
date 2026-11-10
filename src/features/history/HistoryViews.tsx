import { Pressable, StyleSheet, Text, View } from 'react-native';
import { activityTitle, type Activity } from '@/mocks/model';
import { Icon } from '@/design/Icon';
import { colors } from '@/design/tokens';
import { Button, Card, Copy, Notice } from '@/ui/Flow';
import { Sheet } from '@/ui/Sheet';

const minutesFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
export const activityMinutes = (value: string | number) => minutesFormat.format(Number(value));

export const activityDate=(value:string)=>value.split('-').reverse().join('/');
export function historyStatus(activity:Activity,live:boolean) {
  if(activity.status==='pending')return 'Aguardando envio';
  if(activity.status==='sending')return 'Enviando';
  if(activity.status==='failed')return 'Falha no envio';
  if(!live)return 'Salva no aparelho';
  if(activity.validationStatus==='rejected')return 'Não aprovada';
  return activity.validationStatus==='approved' ? 'Registrada' : 'Aguardando validação';
}
function earned(activity:Activity,live:boolean) {return live && activity.status==='confirmed' && activity.validationStatus==='approved' && activity.awardedEv!=null;}
export function HistoryCard({activity,live,onPress}:{activity:Activity;live:boolean;onPress:()=>void}) {
  return <ActivityListCard title={activityTitle(activity)} date={activity.date} minutes={activity.minutes} status={historyStatus(activity,live)} origin={['apple_health','health_connect'].includes(activity.source ?? '') ? 'device' : !activity.source || activity.source==='manual' ? 'manual' : undefined} mental={activity.energyDimension==='intellectual'} failed={activity.status==='failed'} ev={earned(activity,live) ? activity.awardedEv : undefined} onPress={onPress}/>;
}
export function ActivityListCard({title,date,minutes,status,mental=false,failed=false,ev,origin,onPress}:{title:string;date:string;minutes:string;status:string;mental?:boolean;failed?:boolean;ev?:number|null;origin?:'device'|'manual';onPress:()=>void}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${activityMinutes(minutes)} minutos. ${activityDate(date)}. ${status}. ${origin==='device' ? 'Dispositivo.' : origin==='manual' ? 'Manual.' : ''} Ver detalhes.`} onPress={onPress} style={({pressed})=>[s.card,pressed&&{opacity:.75}]}>
    <View style={s.icon}><Icon name={mental ? 'book' : 'activity'} size={24}/></View>
    <View style={s.main}><Text style={s.title} numberOfLines={2}>{title}</Text><Text style={s.meta}>{activityDate(date)} · {activityMinutes(minutes)} min</Text><View style={s.badgeRow}>{origin && <View style={s.badge}><Icon name={origin==='device' ? 'phone' : 'edit'} size={12} color={colors.muted}/><Text style={s.badgeText}>{origin==='device' ? 'Dispositivo' : 'Manual'}</Text></View>}<Text style={[s.status,failed&&s.failure]}>{status}</Text></View></View>
    <View style={s.trailing}>{ev!=null && <Text style={s.ev}>{ev} EV</Text>}<Icon name="arrow" size={18}/></View>
  </Pressable>;
}

export function HistoryDetail({activity,live,offline,busy,canRetry,error,onClose,onRetry}:{activity?:Activity;live:boolean;offline:boolean;busy:boolean;canRetry:boolean;error?:string;onClose:()=>void;onRetry:()=>void}) {
  const source=activity?.source==='manual' ? 'Registro manual' : activity?.source==='apple_health' ? 'Saúde da Apple' : activity?.source==='health_connect' ? 'Health Connect' : null;
  return <Sheet visible={!!activity} title={activity ? activityTitle(activity) : 'Registro'} onClose={onClose}>
    {activity && <>
      <Text style={s.detailStatus}>{historyStatus(activity,live)}</Text>
      <Card title="Atividade"><Copy>{activityDate(activity.date)} · {activityMinutes(activity.minutes)} minutos</Copy>{activity.energyDimension && <Copy muted>{activity.energyDimension==='intellectual' ? 'Mental' : 'Física'}</Copy>}{source && <Copy muted>{source}</Copy>}</Card>
      {earned(activity,live) && <Card title="Energia concedida"><Text style={s.points}>{activity.awardedEv} EV</Text></Card>}
      {activity.status==='confirmed' && live && activity.validationStatus==='approved' && activity.awardedEv==null && <Notice>A pontuação ainda não foi configurada para este registro.</Notice>}
      {!!error && <Notice>{error}</Notice>}
      {!!activity.error && <Notice>{activity.error}</Notice>}
      {activity.status==='pending' && <Copy muted>Registro salvo no aparelho, aguardando envio.</Copy>}
      {activity.status==='sending' && <Copy muted>Seu registro está sendo enviado.</Copy>}
      {!live && <Copy muted>Registro de demonstração.</Copy>}
      <Copy muted>Registrado em {new Date(activity.createdAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'})} · Horário de Brasília</Copy>
      {activity.status==='failed' && <><Button title="Tentar novamente" busy={busy} disabled={offline || !canRetry} onPress={onRetry}/>{!canRetry && live && <Copy muted>Confira a organização e o consentimento de atividades em Configurações antes de reenviar.</Copy>}{offline && <Copy muted>Conecte-se para reenviar.</Copy>}</>}
    </>}
  </Sheet>;
}
const s=StyleSheet.create({
  badgeRow:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:8},badge:{flexDirection:'row',alignItems:'center',gap:4,alignSelf:'flex-start',paddingHorizontal:7,paddingVertical:4,borderRadius:8,backgroundColor:colors.accent},badgeText:{color:colors.muted,fontFamily:'Montserrat_500Medium',fontSize:9},
  card:{flexDirection:'row',alignItems:'center',gap:12,padding:16,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  icon:{width:40,height:40,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:colors.accent},
  main:{flex:1,minWidth:0,gap:5},title:{color:colors.text,fontFamily:'Montserrat_600SemiBold',fontSize:15,lineHeight:21},meta:{color:colors.muted,fontFamily:'Montserrat_400Regular',fontSize:11,lineHeight:17},status:{color:colors.primary,fontFamily:'Montserrat_500Medium',fontSize:10,lineHeight:16},failure:{color:'#FFB3BD'},trailing:{alignItems:'flex-end',gap:10},ev:{color:colors.lime,fontFamily:'Montserrat_600SemiBold',fontSize:12},detailStatus:{color:colors.primary,fontFamily:'Montserrat_600SemiBold',fontSize:13},points:{color:colors.lime,fontFamily:'Montserrat_700Bold',fontSize:28},
});
