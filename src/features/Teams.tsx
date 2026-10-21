import { useRef, useState } from 'react';
import { apiRequest } from '@/api/session';
import { uuid } from '@/api/activityMapping';
import { usePagedResource } from '@/api/usePagedResource';
import { Button, Card, Copy, Flow, Notice } from '@/ui/Flow';
type Team={id:string;name:string;description:string|null;active:boolean;participation:{joined:boolean;revision:number}};
export default function Teams(){
  const {items,busy,error,more,loadMore,refresh}=usePagedResource<Team>('/teams');
  const [sending,setSending]=useState('');const [failure,setFailure]=useState('');
  const inFlight=useRef(false);const pending=useRef<{signature:string;key:string}|null>(null);
  const change=async(team:Team)=>{
    if(inFlight.current)return;inFlight.current=true;setSending(team.id);setFailure('');
    const signature=`${team.id}:${team.participation.revision}:${!team.participation.joined}`;
    if(!pending.current||pending.current.signature!==signature)pending.current={signature,key:uuid()};
    try{await apiRequest(`/teams/${team.id}/participation`,{method:'PUT',body:JSON.stringify({joined:!team.participation.joined,revision:team.participation.revision,operation_key:pending.current.key})});pending.current=null;refresh();}
    catch(e){setFailure(e instanceof Error?e.message:'Não foi possível atualizar sua participação.');}
    finally{inFlight.current=false;setSending('');}
  };
  return <Flow title="Equipes"><Copy muted>Encontre pessoas com um propósito em comum. Você pode participar de equipes de diferentes organizações e sair quando quiser.</Copy>
    {!!error&&<Notice>{error}</Notice>}{!!failure&&<Notice>{failure}</Notice>}
    {busy&&<Copy muted>Carregando equipes…</Copy>}
    {!busy&&!error&&!items.length&&<Card title="Novas conexões vêm aí"><Copy>Nenhuma equipe disponível no momento.</Copy></Card>}
    {items.map(team=><Card key={team.id} title={team.name}>{!!team.description&&<Copy>{team.description}</Copy>}{team.participation.joined&&<Notice>Você participa desta equipe.</Notice>}{!team.active&&<Copy muted>A equipe está pausada para novas entradas.</Copy>}<Button secondary={team.participation.joined} title={sending===team.id?'Atualizando…':team.participation.joined?'Sair da equipe':'Entrar na equipe'} disabled={!!sending||busy||(!team.active&&!team.participation.joined)} onPress={()=>{void change(team);}}/></Card>)}
    {more&&<Button secondary title="Carregar mais equipes" disabled={busy||!!sending} onPress={loadMore}/>}
    <Button secondary title="Atualizar equipes" disabled={busy||!!sending} onPress={refresh}/>
  </Flow>;
}
