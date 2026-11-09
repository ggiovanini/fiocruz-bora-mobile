import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { apiEnabled, apiRequest } from '@/api/session';
import { fromServer } from '@/api/activityMapping';
import type { ServerActivity } from '@/api/contracts';
import type { Activity } from '@/mocks/model';

export function useHistorySearch(query:string,userId?:string) {
  const [items,setItems]=useState<Activity[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const next=useRef<string | null>(null);
  const generation=useRef(0);
  const inFlight=useRef(false);
  const load=useCallback(async(reset:boolean)=>{
    if(!apiEnabled || !query || !userId || inFlight.current)return;
    if(!reset && !next.current)return;
    const token=++generation.current;
    inFlight.current=true;setBusy(true);setError('');
    const cursor=reset ? null : next.current;
    if(reset){setItems([]);next.current=null;}
    try {
      const page=await apiRequest(`/memberships/personal/activities?per_page=20&q=${encodeURIComponent(query)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
      if(token!==generation.current)return;
      const received=(page.data as ServerActivity[]).map(fromServer);
      setItems(previous=>[...new Map((reset ? received : [...previous,...received]).map(item=>[item.id,item])).values()]);
      next.current=page.next_cursor;
    } catch(failure) {if(token===generation.current)setError(failure instanceof Error ? failure.message : 'Não foi possível pesquisar.');}
    finally {if(token===generation.current){inFlight.current=false;setBusy(false);}}
  },[query,userId]);
  useFocusEffect(useCallback(()=>{
    if(query){void load(true);}else{setItems([]);setError('');setBusy(false);next.current=null;}
    return ()=>{generation.current++;inFlight.current=false;};
  },[load,query]));
  return {items,busy,error,more:!!next.current,refresh:()=>{void load(true);},loadMore:()=>{void load(false);}};
}
