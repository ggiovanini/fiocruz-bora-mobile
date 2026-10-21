import {useState} from 'react';
import {View} from 'react-native';
import {Button,Card,Check,Copy,Notice} from '@/ui/Flow';
import {Chip} from '@/components/ActivityUI';
import {useMock} from '@/mocks/MockProvider';
import {apiEnabled,apiRequest} from '@/api/session';
import {importPayload} from '@/health/importPayload';
import type {HealthWorkout} from '@/health/model';
const mapping:Record<string,string>={'Caminhada':'walking','Corrida':'running','Corrida em esteira':'running','Ciclismo':'cycling','Natação':'swimming','Yoga':'yoga'};
export default function HealthWorkoutImport({workout}:{workout:HealthWorkout}) {
 const {state,api}=useMock();
 const [type,setType]=useState(mapping[workout.kind] ?? '');
 const [dimension,setDimension]=useState<'physical'|'intellectual'|undefined>();
 const [confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [result,setResult]=useState<number|null>(null);
 const sharedDemo=api.data.profile?.email?.toLowerCase().endsWith('@bora.example') ?? false;
 const catalog=api.data.catalog.filter(t=>!t.requires_custom_name);
 const chosen=catalog.find(t=>t.code===type);
 const send=async()=>{
  if (!state.membershipId || !confirmed || busy || result!==null) return;
  setBusy(true);setError('');
  try {
   const response=await apiRequest(`/memberships/${state.membershipId}/health-workouts`,{method:'POST',body:JSON.stringify(importPayload(workout,type,chosen?.energy_dimension==='choice'?dimension:undefined))});
   setResult(response.data.scoring.awarded_ev ?? 0);
   try {await api.refresh();} catch {setError('Treino confirmado. Não foi possível atualizar o resumo; atualize a jornada novamente.');}
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível enviar. Tente novamente.');}finally{setBusy(false);}
 };
 return <Card title={workout.kind}>
  <Copy>{new Date(workout.start).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} · {Math.round(workout.durationMinutes*10)/10} minutos</Copy>
  <Copy muted>Origem no aparelho: {workout.origin}</Copy>
  {result!==null ? <Notice>Treino confirmado na jornada · {result} EV. Reenvios do mesmo treino não concedem pontos novamente.</Notice> : apiEnabled ? <>
   <Copy>Registrar na organização: {api.data.memberships.find(m=>m.id===state.membershipId)?.organization_name ?? 'Selecione um vínculo'}</Copy>
   {sharedDemo && <Notice>Perfil de demonstração compartilhado entre testers. Use treinos de teste; os registros enviados ficam salvos neste perfil para testar a jornada.</Notice>}
   <Copy muted>Confira a atividade correspondente:</Copy>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{catalog.map(t=><Chip key={t.code} label={t.name} selected={type===t.code} onPress={()=>{if(!busy){setType(t.code);setDimension(undefined);setConfirmed(false);}}}/>)}</View>
   {chosen?.energy_dimension==='choice' && <View style={{flexDirection:'row',gap:8}}><Chip label="Física" selected={dimension==='physical'} onPress={()=>{if(!busy)setDimension('physical');}}/><Chip label="Mental" selected={dimension==='intellectual'} onPress={()=>{if(!busy)setDimension('intellectual');}}/></View>}
   <Check label="Confirmo que este treino não foi registrado manualmente e autorizo enviar seu tipo, duração, horários e identificador para registrar na jornada e calcular EV." value={confirmed} onChange={value=>{if(!busy)setConfirmed(value);}}/>
   <Button title={busy?'Enviando…':'Enviar treino para a jornada'} disabled={busy||!confirmed||!chosen||!state.membershipId||(chosen.energy_dimension==='choice'&&!dimension)||api.data.consent?.status!=='granted'} onPress={()=>void send()}/>
   {api.data.consent?.status!=='granted' && <Copy muted>É necessário aceitar os termos vigentes de registro de atividades antes de importar.</Copy>}
  </> : <Copy muted>A importação requer conexão com a API e uma sessão ativa.</Copy>}
  {!!error && <Notice>{error}</Notice>}
 </Card>;
}
