import {useEffect,useRef,useState} from 'react';
import {Platform} from 'react-native';
import {Button,Copy,Notice} from '@/ui/Flow';
import {ListScreen} from '@/ui/ListScreen';
import type {CatalogItem} from '@/api/contracts';
import type {HealthWorkout} from '@/health/model';
import type {ImportStatus} from '@/health/importQueue';
import {WorkoutImportView} from './WorkoutImportView';

const catalog:CatalogItem[]=[['walking','Caminhada','physical'],['running','Corrida','physical'],['cycling','Ciclismo','physical'],['yoga','Yoga','choice']].map(([code,name,energy])=>({code,name,energy_dimension:energy as CatalogItem['energy_dimension'],discovery_group:'movement',requires_custom_name:false,ev_per_minute:'1',scoring_status:'configured',timezone:'America/Sao_Paulo',recording_window_days:7}));
function examples():HealthWorkout[] {
 return [{id:'walk',kind:'Caminhada',minutes:35,days:0},{id:'run',kind:'Corrida',minutes:25,days:0},{id:'bike',kind:'Ciclismo',minutes:45,days:1},{id:'yoga',kind:'Yoga',minutes:20,days:2}].map((item,index)=>{
  const start=new Date();start.setUTCDate(start.getUTCDate()-item.days);start.setUTCHours(11+index,0,0,0);
  return {id:item.id,externalId:`visual-example-${item.id}`,source:Platform.OS==='android'?'health-connect':'healthkit',origin:'Relógio de exemplo',kind:item.kind,start:start.toISOString(),end:new Date(start.getTime()+item.minutes*60000).toISOString(),durationMinutes:item.minutes,status:'local-only'};
 });
}
const initialStatuses=():Record<string,ImportStatus>=>({walk:{status:'imported',awardedEv:35},run:{status:'sending'},bike:{status:'failed',message:'Exemplo: não foi possível conectar. Você pode simular uma nova tentativa.',retryable:true},yoga:{status:'review',message:'Escolha Física ou Mental para este treino de exemplo.'}});
export default function HealthPreview() {
 const [workouts]=useState(examples);
 const [statuses,setStatuses]=useState(initialStatuses);
 const mounted=useRef(true);
 const generation=useRef(0);
 const [version,setVersion]=useState(0);
 useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;generation.current++;};},[]);
 async function simulate(workout:HealthWorkout) {
  const token=generation.current;
  setStatuses(previous=>({...previous,[workout.id]:{status:'sending'}}));
  await new Promise<void>(resolve=>setTimeout(resolve,900));
  if(mounted.current && token===generation.current)setStatuses(previous=>({...previous,[workout.id]:{status:'imported',awardedEv:Math.floor(workout.durationMinutes)}}));
 }
 return <ListScreen title="Treinos de exemplo" icon="phone">
  <Notice>Simulação visual. Estes treinos não são enviados e não alteram sua jornada.</Notice>
  <Copy muted>Toque para conferir o detalhe e experimentar uma tentativa de envio.</Copy>
  {workouts.map(workout=><WorkoutImportView key={`${workout.id}:${version}`} workout={workout} entry={statuses[workout.id]} items={catalog} membershipLabel="Jornada de exemplo" canSend consentGranted illustrative onSend={()=>simulate(workout)}/>)}
  <Button secondary title="Concluir envio de exemplo" disabled={statuses.run.status!=='sending'} onPress={()=>setStatuses(previous=>({...previous,run:{status:'imported',awardedEv:25}}))}/>
  <Button secondary title="Reiniciar exemplos" onPress={()=>{generation.current++;setVersion(value=>value+1);setStatuses(initialStatuses());}}/>
 </ListScreen>;
}
