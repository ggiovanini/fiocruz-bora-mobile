const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const Module=require('node:module');
const ts=require('typescript');
const key='bora:temporary-api-session:v1';
function setup(t){
 const storage=new Map([[key,JSON.stringify({token:'old-token'})]]);
 const file=new Module('session');
 file.require=name=>{if(name==='@react-native-async-storage/async-storage')return {getItem:async k=>storage.get(k)??null,setItem:async(k,v)=>storage.set(k,v),removeItem:async k=>storage.delete(k)};throw new Error(name)};
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
