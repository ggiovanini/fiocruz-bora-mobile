import type { CatalogItem } from '../api/contracts';
import type { HealthWorkout } from './model';
import { importPayload } from './importPayload';

const mapping:Record<string,string>={Caminhada:'walking',Corrida:'running','Corrida em esteira':'running',Ciclismo:'cycling','Natação':'swimming',Yoga:'yoga'};
export const workoutActivityCode=(workout:HealthWorkout)=>mapping[workout.kind] ?? '';
export type ImportStatus={status:'sending'|'imported'|'review'|'failed';message?:string;awardedEv?:number|null;retryable?:boolean;blockBatch?:boolean;cycle?:string};
export type WorkoutPayload=ReturnType<typeof importPayload> & {import_mode:'manual'|'automatic'};
export class HealthImportQueue {
  private state:Record<string,ImportStatus>={};
  private listeners=new Set<()=>void>();
  private pending=new Map<string,Promise<void>>();
  private stopped=false;
  private batching=false;
  private pausedCycle?:string;
  constructor(private send:(payload:WorkoutPayload)=>Promise<{scoring:{awarded_ev:number|null}}>) {}
  getSnapshot=()=>this.state;
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return ()=>{this.listeners.delete(listener);};};
  start=()=>{this.stopped=false;};
  stop=()=>{this.stopped=true;};
  private update(id:string,value:ImportStatus){if(this.stopped)return;this.state={...this.state,[id]:value};this.listeners.forEach(fn=>fn());}
  async submit(workout:HealthWorkout,code:string,dimension:'physical'|'intellectual'|undefined,mode:'manual'|'automatic',allowed:()=>boolean,cycle?:string):Promise<void> {
    if(this.stopped || !allowed() || this.state[workout.id]?.status==='imported')return;
    const existing=this.pending.get(workout.id);if(existing)return existing;
    // Defer execution until the per-record lock is installed.
    const task=Promise.resolve().then(async()=>{
      if(this.stopped || !allowed())return;
      this.update(workout.id,{status:'sending',cycle});
      try {
        const payload={...importPayload(workout,code,dimension),import_mode:mode};
        if(this.stopped || !allowed())return;
        const response=await this.send(payload);
        this.update(workout.id,{status:'imported',awardedEv:response.scoring.awarded_ev,cycle});
      } catch(failure) {
        const status=(failure as {status?:number})?.status;
        const retryable=status===0 || status===408 || status===429 || (status!==undefined && status>=500);
        this.update(workout.id,{status:retryable ? 'failed' : 'review',message:failure instanceof Error ? failure.message : 'Não foi possível enviar o treino.',retryable,blockBatch:retryable || status===401 || status===403,cycle});
      }
    }).finally(()=>{this.pending.delete(workout.id);if(!this.stopped && this.state[workout.id]?.status==='sending'){
      this.state={...this.state};delete this.state[workout.id];this.listeners.forEach(fn=>fn());
    }});
    this.pending.set(workout.id,task);return task;
  }
  async automatic(workouts:HealthWorkout[],catalog:CatalogItem[],cycle:string,allowed:()=>boolean):Promise<boolean> {
    if(this.batching || this.stopped || this.pausedCycle===cycle || !allowed())return false;
    this.batching=true;let imported=false;
    try {
      // Chronological order gives overlapping source records a stable first candidate.
      for(const workout of [...workouts].sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id))) {
        if(this.stopped || !allowed())break;
        const prior=this.state[workout.id];
        if(prior?.status==='imported' || prior?.status==='sending' || prior?.cycle===cycle)continue;
        if(prior?.status==='review' && prior.retryable===false)continue;
        const item=catalog.find(item=>item.code===workoutActivityCode(workout) && !item.requires_custom_name);
        if(!item || item.scoring_status!=='configured' || (item.energy_dimension!=='physical' && item.energy_dimension!=='intellectual')) {
          this.update(workout.id,{status:'review',message:'Confira a atividade e a dimensão antes de enviar.',cycle});continue;
        }
        await this.submit(workout,item.code,undefined,'automatic',allowed,cycle);
        if(this.state[workout.id]?.status==='imported')imported=true;
        if(this.state[workout.id]?.blockBatch){this.pausedCycle=cycle;break;}
      }
    } finally {this.batching=false;}
    return imported;
  }
}
