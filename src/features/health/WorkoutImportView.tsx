import { ActivityListCard, activityMinutes } from '../history/HistoryViews';
import {useState} from 'react';
import {Button,Card,Check,Copy,Notice} from '@/ui/Flow';
import {Sheet} from '@/ui/Sheet';
import type {CatalogItem} from '@/api/contracts';
import {workoutActivityCode,type ImportStatus} from '@/health/importQueue';
import type {HealthWorkout} from '@/health/model';

export function WorkoutImportView({workout,entry,items,membershipLabel,canSend,consentGranted,available=true,illustrative=false,onSend}:{
 workout:HealthWorkout;entry?:ImportStatus;items:CatalogItem[];membershipLabel:string;canSend:boolean;consentGranted:boolean;available?:boolean;illustrative?:boolean;onSend:(type:string)=>Promise<void>;
}) {
 const imported=entry?.status==='imported';
 const result=entry?.awardedEv;
 const [detailsOpen,setDetailsOpen]=useState(false);
 const type=workoutActivityCode(workout,items);
 const [confirmed,setConfirmed]=useState(false),[localBusy,setBusy]=useState(false),[error,setError]=useState('');
 const busy=localBusy || entry?.status==='sending';
 const catalog=items.filter(t=>t.scoring_status === 'configured' && (t.energy_dimension === 'physical' || t.energy_dimension === 'intellectual'));
 const chosen=catalog.find(t=>t.code===type);
 const send=async()=>{
  if (!canSend || !confirmed || busy || imported) return;
  setBusy(true);setError('');
  try {
   await onSend(type);
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível enviar. Tente novamente.');}finally{setBusy(false);}
 };
 const detail = <Card title={workout.name || workout.kind}>
  <Copy>{new Date(workout.start).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} · {activityMinutes(workout.durationMinutes)} minutos</Copy>
  <Copy muted>Origem no aparelho: {workout.origin}</Copy>
  {imported ? <Notice>Treino confirmado na jornada{result!=null ? ` · ${result} EV` : '. Pontuação ainda não configurada'}. Reenvios do mesmo treino não concedem pontos novamente.</Notice> : available ? <>
   <Copy>Registrar em: {membershipLabel}</Copy>
   <Copy muted>O nome do dispositivo é mantido. A categoria para calcular EV é identificada automaticamente.</Copy>
   {chosen && <Copy muted>Categoria: {chosen.name} · Energia {chosen.energy_dimension === 'physical' ? 'física' : 'mental'}</Copy>}
   {!chosen && <Copy muted>A categoria deste treino ainda não está disponível para importação.</Copy>}
   <Check label={illustrative ? 'Confirmo os dados deste treino de exemplo.' : 'Confirmo que este treino não foi registrado manualmente e autorizo enviar seu nome, tipo, duração, horários e identificador para registrar na jornada e calcular EV.'} value={confirmed} onChange={value=>{if(!busy)setConfirmed(value);}}/>
   <Button title={busy?'Enviando…':illustrative?'Simular envio':'Enviar treino para a jornada'} disabled={busy||!confirmed||!chosen||!canSend||!consentGranted} onPress={()=>void send()}/>
   {!consentGranted && <Copy muted>É necessário aceitar os termos vigentes de registro de atividades antes de importar.</Copy>}
  </> : <Copy muted>A importação requer conexão com a API e uma sessão ativa.</Copy>}
  {!!(error || entry?.message) && <Notice>{error || entry?.message}</Notice>}
 </Card>;
 return <>
  <ActivityListCard origin="device" title={workout.name || workout.kind} date={new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(workout.start))} minutes={String(workout.durationMinutes)} status={imported ? 'Registrada' : entry?.status==='sending' ? 'Enviando' : entry?.status==='failed' ? 'Falha no envio' : entry?.status==='review' ? 'Revisar treino' : 'Disponível para importar'} failed={entry?.status==='failed'} ev={imported ? result : undefined} onPress={()=>setDetailsOpen(true)}/>
  <Sheet visible={detailsOpen} title="Detalhe do treino" onClose={()=>setDetailsOpen(false)}>{illustrative && <Notice>Simulação. Nenhum dado é enviado.</Notice>}{detail}</Sheet>
 </>;
}
