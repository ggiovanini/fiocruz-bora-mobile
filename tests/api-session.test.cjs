const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const Module=require('node:module');
const ts=require('typescript');
const key='secure-session';
function setup(t, login = {}){
 const storage=new Map([[key,JSON.stringify({token:'old-token'})]]);
 const file=new Module('session');
 file.require=name=>{if(name==='./config')return {getApiBaseUrl:()=>process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/,'')??''};if(name==='@react-native-async-storage/async-storage')return {getItem:async k=>storage.get(k)??null,setItem:async(k,v)=>storage.set(k,v),removeItem:async k=>storage.delete(k)};throw new Error(name)};
 const previousRequire=file.require;
 file.require=name=>name==='./credentialStorage'?{credentialStorage:{get:async()=>storage.get(key)??null,set:async value=>storage.set(key,value),remove:async()=>storage.delete(key)}}:name==='./localLogin'?{useLocalLogin:()=>login.local ?? false,localLogin:login.localLogin}:name==='./institutionalLogin'?{institutionalLogin:login.institutionalLogin ?? (async()=>{throw new Error('Not invoked in session tests')})}:previousRequire(name);
 const previous=process.env.EXPO_PUBLIC_API_URL;process.env.EXPO_PUBLIC_API_URL='https://bora.example/api/v1';
 t.after(()=>{if(previous===undefined)delete process.env.EXPO_PUBLIC_API_URL;else process.env.EXPO_PUBLIC_API_URL=previous;});
 file._compile(ts.transpileModule(readFileSync('src/api/session.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,'session.cjs');
 return {...file.exports,storage};
}
test('validation errors keep field details and never discard the authenticated session',async t=>{
 const api=setup(t);
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  assert.equal(init.headers.Authorization,'Bearer old-token');
  return {ok:false,status:422,json:async()=>({message:'Invalid',errors:{duration_seconds:['Duração inválida.']}})};
 });
 await assert.rejects(api.apiRequest('/activities'),error=>error.status===422&&error.message==='Duração inválida.'&&error.errors.duration_seconds[0]==='Duração inválida.');
 assert.ok(api.storage.has(key));
});
test('401 expires the current session once and tells the app to leave authenticated screens',async t=>{
 const api=setup(t);let expired=0;
 api.onSessionExpired(()=>expired++);
 t.mock.method(globalThis,'fetch',async()=>({ok:false,status:401,json:async()=>({})}));
 await assert.rejects(api.apiRequest('/me'),/expirou/);
 assert.equal(api.storage.has(key),false);assert.equal(expired,1);
});
test('a late 401 from an older token cannot remove a newly established session',async t=>{
 const api=setup(t);let expired=0;
 api.onSessionExpired(()=>expired++);
 t.mock.method(globalThis,'fetch',async()=>{
  api.storage.set(key,JSON.stringify({token:'new-token'}));
  return {ok:false,status:401,json:async()=>({})};
 });
 await assert.rejects(api.apiRequest('/me'));
 assert.equal(JSON.parse(api.storage.get(key)).token,'new-token');assert.equal(expired,0);
});
test('network failures preserve the token for retry and retain the original operation headers and body',async t=>{
 const api=setup(t);
 const body=JSON.stringify({client_activity_id:'same-id'});
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  assert.equal(init.headers['Idempotency-Key'],'same-key');assert.equal(init.body,body);
  throw new Error('connection lost');
 });
 await assert.rejects(api.apiRequest('/activities',{method:'POST',headers:{'Idempotency-Key':'same-key'},body}),error=>error.status===0);
 assert.ok(api.storage.has(key));
});

test('login selects the local session, persists it and restores it without another random draw',async t=>{
 let draws=0;
 const session={token:'demo',user:{id:'demo-id',display_name:'Demo'},expires_at:new Date(Date.now()+3600000).toISOString(),installation_id:'install'};
 const api=setup(t,{local:true,localLogin:async()=>{draws++;return session;}});
 api.storage.clear();
 assert.equal((await api.loginInstitutional()).id,'demo-id');
 assert.equal(JSON.parse(api.storage.get(key)).installation_id,'install');
 t.mock.method(globalThis,'fetch',async()=>({ok:true,status:200,json:async()=>({data:session.user})}));
 assert.equal((await api.loginInstitutional()).id,'demo-id');assert.equal(draws,1);
});
test('institutional failures never fall back to demo login',async t=>{
 const api=setup(t,{local:false,institutionalLogin:async()=>{throw new Error('SSO unavailable')},localLogin:async()=>assert.fail('No demo fallback')});
 api.storage.clear();
 await assert.rejects(api.loginInstitutional(),/SSO unavailable/);
 assert.equal(api.storage.has(key),false);
});
