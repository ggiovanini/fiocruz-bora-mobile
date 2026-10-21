const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const Module=require('node:module');
const path=require('node:path');
const ts=require('typescript');
const React=require('react');
const {renderToString}=require('react-dom/server');
function harness(){
 const storage=new Map();
 const calls=[];
 let release;
 const lock=new Promise(resolve=>release=resolve);
 const current={current:{version:1,session:'active',accepted:true,profileComplete:true,userId:'user',membershipId:'member',activities:[],checkins:[],name:'Pessoa',organization:'Org'}};
 const writes={current:Promise.resolve()};
 const files=new Map();
 const serverRow=payload=>({id:`server-${payload.client_activity_id}`,client_activity_id:payload.client_activity_id,membership_id:'member',activity_type:'walking',activity_name:'Caminhada',activity_date:'2026-10-20',duration_seconds:60,created_at:'2026-10-20T12:00:00Z',validation_status:'approved',scoring:{awarded_ev:1,energy_dimension:'physical'}});
 const request=async(url,init={})=>{
  calls.push({url,init});
  if(init.method==='POST'&&url.endsWith('/activities')){
   if(calls.filter(call=>call.init.method==='POST').length===1)await lock;
   return {data:serverRow(JSON.parse(init.body))};
  }
  if(url==='/me')return {data:{id:'user',display_name:'Pessoa'}};
  if(url==='/me/memberships')return {data:[{id:'member',organization_name:'Org'}]};
  if(url==='/me/energy')return {data:{today:{date:'2026-10-20'},days:[]}};
  if(url==='/activity-types')return {data:[]};
  if(url.endsWith('/consents/activity-recording'))return {data:{configured:true,status:'granted',policy_version:'v1'}};
  if(url.includes('/activities'))return {data:[],next_cursor:null};
  return {};
 };
 function load(file){
  file=path.resolve(file);
  if(files.has(file))return files.get(file).exports;
  const mod=new Module(file);files.set(file,mod);
  mod.require=name=>{
   if(name==='react')return React;
   if(name==='react-native')return {Platform:{OS:'web'}};
   if(name==='@react-native-async-storage/async-storage')return {getItem:async key=>storage.get(key)??null,setItem:async(key,value)=>storage.set(key,value)};
   if(name==='./session')return {apiRequest:request,clearApiSession:async()=>{},loginForTesting:async()=>({id:'user'}),ApiError:class extends Error{}};
   if(name.startsWith('.'))return load(path.resolve(path.dirname(file),name+'.ts'));
   throw new Error(name);
  };
  mod._compile(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file);
  return mod.exports;
 }
 let api;
 const {useJourneyConnection}=load('src/api/useJourneyConnection.ts');
 renderToString(React.createElement(function Probe(){api=useJourneyConnection(current,state=>{current.current=state;},writes);return null;}));
 const activity=id=>({id,type:'Caminhada',minutes:'1',date:'2026-10-20',status:'pending',createdAt:'2026-10-20T12:00:00Z',membershipId:'member',operationKey:`operation-${id}`,apiPayload:{client_activity_id:id,activity_type:'walking',activity_date:'2026-10-20',timezone:'America/Sao_Paulo',duration_seconds:60}});
 return {api,current,writes,calls,release,activity};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('durable pending activities drain sequentially even when a summary refresh renders during the first request',async()=>{
 const h=harness();
 const first=h.activity('first'),second=h.activity('second');
 h.current.current.activities=[first,second];
 let persist;
 h.writes.current=new Promise(resolve=>persist=resolve);
 const send=h.api.send(first);
 await tick();assert.equal(h.calls.length,0);
 persist();await tick();
 assert.equal(h.calls.filter(call=>call.init.method==='POST').length,1);
 await h.api.send(second);
 assert.equal(h.calls.filter(call=>call.init.method==='POST').length,1);
 h.release();await send;
 for(let attempt=0;attempt<10&&h.current.current.activities.some(row=>row.status!=='confirmed');attempt++)await tick();
 assert.equal(h.calls.filter(call=>call.init.method==='POST').length,2);
 assert.equal(h.current.current.activities.filter(row=>row.status==='confirmed').length,2);
});
test('logging out stops the remaining queue and ignores a late success from the prior account',async()=>{
 const h=harness();const first=h.activity('first'),second=h.activity('second');
 h.current.current.activities=[first,second];
 const send=h.api.send(first);await tick();
 await h.api.logout();h.release();await send;await tick();
 assert.equal(h.current.current.session,'signedOut');
 assert.equal(h.current.current.activities.length,0);
 assert.equal(h.calls.filter(call=>call.init.method==='POST'&&call.url.endsWith('/activities')).length,1);
});
