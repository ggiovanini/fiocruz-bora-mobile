import { createContext,useContext,useEffect,useRef,useState,useSyncExternalStore,type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { apiEnabled,apiRequest } from '@/api/session';
import { hasAccess,useMock } from '@/mocks/MockProvider';
import { useHealth } from './HealthProvider';
import { preferenceKey,type WorkoutPreference, HealthImportQueue } from './importQueue';
import type { HealthWorkout } from './model';

type ContextValue={statuses:ReturnType<HealthImportQueue['getSnapshot']>;submit:(workout:HealthWorkout,code:string,dimension?:'physical'|'intellectual',remember?:boolean)=>Promise<void>;preferences:Record<string,WorkoutPreference>};
const Context=createContext<ContextValue|null>(null);
export function HealthImportProvider({children}:PropsWithChildren) {
  const {state,api,ready:identityReady}=useMock();
  const {state:health,session,ready,preferenceError}=useHealth();
  const [preferences,setPreferences]=useState<Record<string,WorkoutPreference>>({});
  const [preferencesReady,setPreferencesReady]=useState(false);
  useEffect(()=>{
    let disposed=false;setPreferences({});setPreferencesReady(false);
    if(apiEnabled && state.userId) void apiRequest('/me/health-workout-preferences',{},state.userId).then(response=>{if(!disposed){setPreferences(response.data);setPreferencesReady(true);}}).catch(()=>{if(!disposed)setPreferencesReady(true);});
    return ()=>{disposed=true;};
  },[state.userId]);
  const active=useRef(AppState.currentState==='active');
  const mounted=useRef(true);
  const context=useRef({state,api,ready,identityReady,preferenceError});context.current={state,api,ready,identityReady,preferenceError};
  const owner=useRef({userId:state.userId,membershipId:state.membershipId});
  const allowed=()=>{
    const c=context.current;const current=session.getSnapshot();
    return mounted.current && active.current && apiEnabled && c.ready && c.identityReady && hasAccess(c.state) && !c.state.offline && current.connected && c.api.data.consent?.status==='granted'
      && !!owner.current.userId && c.state.userId===owner.current.userId && !!owner.current.membershipId && c.state.membershipId===owner.current.membershipId;
  };
  const automaticAllowed=()=>allowed() && !context.current.preferenceError && session.getSnapshot().automatic && session.getSnapshot().automaticImport;
  const [queue]=useState(()=>new HealthImportQueue(async payload=>{
    if(!allowed())throw new Error('A conexão ou autorização mudou. Confira as configurações antes de enviar.');
    try {
      const response=await apiRequest(`/memberships/${owner.current.membershipId}/health-workouts`,{method:'POST',body:JSON.stringify(payload)},owner.current.userId);
      return response.data;
    } catch(failure) {
      if((failure as {status?:number})?.status===403 && allowed())void context.current.api.refresh().catch(()=>{});
      throw failure;
    }
  }));
  const statuses=useSyncExternalStore(queue.subscribe,queue.getSnapshot,queue.getSnapshot);
  useEffect(()=>{
    mounted.current=true;queue.start();
    const listener=AppState.addEventListener('change',value=>{active.current=value==='active';});
    return ()=>{mounted.current=false;queue.stop();listener.remove();};
  },[queue]);
  useEffect(()=>{
    if(!preferencesReady || !health.snapshot || !automaticAllowed())return;
    void queue.automatic(health.snapshot.workouts,api.data.catalog,health.snapshot.syncedAt,automaticAllowed,preferences).then(imported=>{
      if(imported && allowed())void context.current.api.refresh().catch(()=>{});
    });
  },[preferencesReady,preferences,queue,health.snapshot,health.automaticImport,health.automatic,health.connected,ready,identityReady,preferenceError,api.data.catalog,api.data.consent?.status,state.offline,state.userId,state.membershipId]);
  const submit=async(workout:HealthWorkout,code:string,dimension?:'physical'|'intellectual',remember=false)=>{
    if(!allowed())throw new Error('Conecte o aparelho e confira os termos de registro antes de enviar.');
    await queue.submit(workout,code,dimension,'manual',allowed);
    if(queue.getSnapshot()[workout.id]?.status==='imported' && allowed()) {
      await context.current.api.refresh().catch(()=>{});
      if(remember && workout.nativeType) {
        try {
          await apiRequest('/me/health-workout-preferences',{method:'PUT',body:JSON.stringify({source:workout.source,native_type:workout.nativeType,activity_type:code,energy_dimension:dimension})},owner.current.userId);
          if(allowed())setPreferences(previous=>({...previous,[preferenceKey(workout)]:{activity_type:code,energy_dimension:dimension}}));
        } catch { throw new Error('Treino registrado, mas não foi possível salvar a preferência no perfil.'); }
      }
    }
  };
  return <Context.Provider value={{statuses,submit,preferences}}>{children}</Context.Provider>;
}
export function useHealthImports(){const value=useContext(Context);if(!value)throw new Error('HealthImportProvider is required');return value;}
