import {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {Button,Card,Check,Copy,Notice} from '@/ui/Flow';
import {Sheet} from '@/ui/Sheet';
import {Icon} from '@/design/Icon';
import {colors} from '@/design/tokens';
import {Chip} from '@/components/ActivityUI';
import type {CatalogItem} from '@/api/contracts';
import {workoutActivityCode,type ImportStatus} from '@/health/importQueue';
import type {HealthWorkout} from '@/health/model';

export function WorkoutImportView({workout,entry,items,membershipLabel,canSend,consentGranted,available=true,sharedDemo=false,illustrative=false,onSend}:{
 workout:HealthWorkout;entry?:ImportStatus;items:CatalogItem[];membershipLabel:string;canSend:boolean;consentGranted:boolean;available?:boolean;sharedDemo?:boolean;illustrative?:boolean;onSend:(type:string,dimension?:'physical'|'intellectual')=>Promise<void>;
}) {
 const imported=entry?.status==='imported';
 const result=entry?.awardedEv;
 const [detailsOpen,setDetailsOpen]=useState(false);
 const [type,setType]=useState(workoutActivityCode(workout));
 const [dimension,setDimension]=useState<'physical'|'intellectual'|undefined>();
 const [confirmed,setConfirmed]=useState(false),[localBusy,setBusy]=useState(false),[error,setError]=useState('');
 const busy=localBusy || entry?.status==='sending';
 const catalog=items.filter(t=>!t.requires_custom_name);
 const chosen=catalog.find(t=>t.code===type);
 const send=async()=>{
  if (!canSend || !confirmed || busy || imported) return;
  setBusy(true);setError('');
  try {
   await onSend(type,chosen?.energy_dimension==='choice'?dimension:undefined);
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível enviar. Tente novamente.');}finally{setBusy(false);}
 };
 const detail = <Card title={workout.kind}>
  <Copy>{new Date(workout.start).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} · {Math.round(workout.durationMinutes*10)/10} minutos</Copy>
  <Copy muted>Origem no aparelho: {workout.origin}</Copy>
  {imported ? <Notice>Treino confirmado na jornada{result!=null ? ` · ${result} EV` : '. Pontuação ainda não configurada'}. Reenvios do mesmo treino não concedem pontos novamente.</Notice> : available ? <>
   <Copy>Registrar em: {membershipLabel}</Copy>
   {sharedDemo && <Notice>Perfil de demonstração compartilhado entre testers. Use treinos de teste; os registros enviados ficam salvos neste perfil para testar a jornada.</Notice>}
   <Copy muted>Confira a atividade correspondente:</Copy>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{catalog.map(t=><Chip key={t.code} label={t.name} selected={type===t.code} onPress={()=>{if(!busy){setType(t.code);setDimension(undefined);setConfirmed(false);}}}/>)}</View>
   {chosen?.energy_dimension==='choice' && <View style={{flexDirection:'row',gap:8}}><Chip label="Física" selected={dimension==='physical'} onPress={()=>{if(!busy)setDimension('physical');}}/><Chip label="Mental" selected={dimension==='intellectual'} onPress={()=>{if(!busy)setDimension('intellectual');}}/></View>}
   <Check label={illustrative ? 'Confirmo os dados deste treino de exemplo.' : 'Confirmo que este treino não foi registrado manualmente e autorizo enviar seu tipo, duração, horários e identificador para registrar na jornada e calcular EV.'} value={confirmed} onChange={value=>{if(!busy)setConfirmed(value);}}/>
   <Button title={busy?'Enviando…':illustrative?'Simular envio':'Enviar treino para a jornada'} disabled={busy||!confirmed||!chosen||!canSend||(chosen.energy_dimension==='choice'&&!dimension)||!consentGranted} onPress={()=>void send()}/>
   {!consentGranted && <Copy muted>É necessário aceitar os termos vigentes de registro de atividades antes de importar.</Copy>}
  </> : <Copy muted>A importação requer conexão com a API e uma sessão ativa.</Copy>}
  {!!(error || entry?.message) && <Notice>{error || entry?.message}</Notice>}
 </Card>;
 return <>
  <Pressable accessibilityRole="button" accessibilityLabel={`${workout.kind}, ${Math.round(workout.durationMinutes*10)/10} minutos. ${imported ? 'Treino confirmado.' : 'Ver treino e importar.'}`} onPress={()=>setDetailsOpen(true)} style={({pressed})=>({padding:16,borderRadius:16,backgroundColor:colors.surface,flexDirection:'row',alignItems:'center',gap:12,opacity:pressed ? .7 : 1})}>
   <Icon name={imported?'check':entry?.status==='sending'?'clock':'activity'} color={colors.lime}/>
   <View style={{flex:1,gap:5}}><Text style={{color:colors.text,fontFamily:'Montserrat_600SemiBold',fontSize:15}}>{workout.kind}</Text><Text style={{color:colors.muted,fontSize:12}}>{new Date(workout.start).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} · {Math.round(workout.durationMinutes*10)/10} min</Text>{!imported && entry && <Text style={{color:colors.muted,fontSize:12}}>{entry.status==='sending'?'Enviando…':entry.status==='review'?'Revisar treino':'Falha no envio · tente novamente'}</Text>}{imported&&<Text style={{color:colors.lime,fontSize:12}}>Confirmado{result!=null ? ` · ${result} EV` : ''}</Text>}</View><Icon name="arrow" size={18}/>
  </Pressable>
  <Sheet visible={detailsOpen} title="Detalhe do treino" onClose={()=>setDetailsOpen(false)}>{illustrative && <Notice>Simulação. Nenhum dado é enviado.</Notice>}{detail}</Sheet>
 </>;
}
