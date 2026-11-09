const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const Module=require('node:module');
const path=require('node:path');
const ts=require('typescript');
function load(file,mocks={}) {
 file=path.resolve(file);const m=new Module(file);m.paths=module.paths;
 const normal=m.require.bind(m);m.require=name=>name in mocks?mocks[name]:name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts'),mocks):normal(name);
 m._compile(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file+'.cjs');return m.exports;
}
const {HealthImportQueue}=load('src/health/importQueue.ts');
const workout=(id='one',kind='Caminhada')=>({id:`healthkit:${id}`,externalId:id,source:'healthkit',origin:'Private device',kind,start:'2026-11-09T10:00:00Z',end:'2026-11-09T10:30:00Z',durationMinutes:20,status:'local-only'});
const catalog=[{code:'walking',scoring_status:'configured',energy_dimension:'physical',requires_custom_name:false},{code:'yoga',scoring_status:'configured',energy_dimension:'choice',requires_custom_name:false}];
const ok=async()=>({scoring:{awarded_ev:20}});
test('automatic uploads require authorization, skip ambiguous types and send only allowed fields',async()=>{
 const sent=[];const queue=new HealthImportQueue(async payload=>{sent.push(payload);return ok();});
 await queue.automatic([workout()],catalog,'one',()=>false);assert.equal(sent.length,0);
 await queue.automatic([workout(),workout('yoga','Yoga'),workout('other','Outro treino')],catalog,'one',()=>true);
 assert.equal(sent.length,1);assert.equal(sent[0].import_mode,'automatic');assert.equal(sent[0].confirmed,true);
 assert.equal(sent[0].origin,undefined);assert.equal(sent[0].steps,undefined);assert.equal(sent[0].user_id,undefined);assert.equal(sent[0].ev,undefined);
 assert.equal(queue.getSnapshot()['healthkit:one'].status,'imported');
 assert.equal(queue.getSnapshot()['healthkit:yoga'].status,'review');assert.equal(queue.getSnapshot()['healthkit:other'].status,'review');
 await queue.submit(workout('yoga','Yoga'),'yoga','physical','manual',()=>true);
 assert.equal(sent[1].energy_dimension,'physical');assert.equal(sent[1].import_mode,'manual');
});
test('manual and automatic paths share a per-workout lock and do not repeat successful uploads',async()=>{
 let finish;const sent=[];const queue=new HealthImportQueue(payload=>{sent.push(payload);return new Promise(resolve=>finish=resolve);});
 const automatic=queue.automatic([workout(),workout()],catalog,'one',()=>true);
 await Promise.resolve();
 const manual=queue.submit(workout(),'walking',undefined,'manual',()=>true);
 finish({scoring:{awarded_ev:null}});await Promise.all([automatic,manual]);
 assert.equal(sent.length,1);assert.equal(queue.getSnapshot()['healthkit:one'].awardedEv,null);
 await queue.automatic([workout()],catalog,'two',()=>true);assert.equal(sent.length,1);
});
test('network failures retry on a new reading cycle with the exact same identity and payload',async()=>{
 const sent=[];const queue=new HealthImportQueue(async payload=>{sent.push(payload);if(sent.length===1)throw Object.assign(new Error('Sem conexão'),{status:0});return ok();});
 await queue.automatic([workout()],catalog,'one',()=>true);assert.equal(queue.getSnapshot()['healthkit:one'].status,'failed');
 await queue.automatic([workout()],catalog,'one',()=>true);assert.equal(sent.length,1);
 await queue.automatic([workout()],catalog,'two',()=>true);assert.equal(sent.length,2);assert.deepEqual(sent[0],sent[1]);
 assert.equal(queue.getSnapshot()['healthkit:one'].status,'imported');
});
test('validation and overlap conflicts stay for review instead of retrying automatically',async()=>{
 let count=0;const queue=new HealthImportQueue(async()=>{count++;throw Object.assign(new Error('Já existe um registro'),{status:422});});
 await queue.automatic([workout()],catalog,'one',()=>true);await queue.automatic([workout()],catalog,'two',()=>true);
 assert.equal(count,1);assert.equal(queue.getSnapshot()['healthkit:one'].status,'review');
 await queue.submit(workout(),'walking',undefined,'manual',()=>true);assert.equal(count,2);
});
test('revoking authorization during a batch stops subsequent uploads; stopped sessions ignore late responses',async()=>{
 let allowed=true,finish;const sent=[];const queue=new HealthImportQueue(payload=>{sent.push(payload);return new Promise(resolve=>finish=resolve);});
 const running=queue.automatic([workout('one'),workout('two')],catalog,'one',()=>allowed);
 await Promise.resolve();allowed=false;finish({scoring:{awarded_ev:20}});await running;assert.equal(sent.length,1);
 let release;const old=new HealthImportQueue(()=>new Promise(resolve=>release=resolve));
 const pending=old.automatic([workout()],catalog,'one',()=>true);await Promise.resolve();old.stop();release({scoring:{awarded_ev:20}});await pending;
 assert.notEqual(old.getSnapshot()['healthkit:one']?.status,'imported');
});
test('invalid durations never reach the server and old preferences never authorize uploads',async()=>{
 let sent=0;const queue=new HealthImportQueue(async()=>{sent++;return ok();});
 await queue.automatic([{...workout(),durationMinutes:0}],catalog,'one',()=>true);assert.equal(sent,0);assert.equal(queue.getSnapshot()['healthkit:one'].status,'review');
 const {HealthSession}=load('src/health/model.ts');const session=new HealthSession({});
 session.restorePreferences({connected:true,automatic:true});assert.equal(session.getSnapshot().automaticImport,false);
 session.setAutomaticImport(true);assert.equal(session.getSnapshot().automaticImport,true);
 session.disconnect();assert.equal(session.getSnapshot().automaticImport,false);
});
test('a changed login cannot send an earlier accounts health payload using the new token',async()=>{
 const originalFetch=global.fetch;let sent=0;
 global.fetch=async()=>{sent++;throw new Error('Should not send');};
 try {
  const {apiRequest}=load('src/api/session.ts',{'./config':{getApiBaseUrl:()=> 'https://api.example.test/api/v1'},'@react-native-async-storage/async-storage':{getItem:async()=>JSON.stringify({token:'new-token',user:{id:'new-user'}})}});
  await assert.rejects(apiRequest('/memberships/personal/health-workouts',{method:'POST',body:'sensitive'},'old-user'),/conta mudou/);
  assert.equal(sent,0);
 } finally {global.fetch=originalFetch;}
});

test('a connectivity failure pauses the batch instead of flooding the service with the remaining workouts',async()=>{
 const sent=[];let fail=true;
 const queue=new HealthImportQueue(async payload=>{sent.push(payload.external_id);if(fail)throw Object.assign(new Error('Offline'),{status:0});return ok();});
 await queue.automatic([workout('one'),workout('two')],catalog,'one',()=>true);
 assert.deepEqual(sent,['one']);
 await queue.automatic([workout('one'),workout('two')],catalog,'one',()=>true);assert.deepEqual(sent,['one']);fail=false;
 await queue.automatic([workout('one'),workout('two')],catalog,'two',()=>true);
 assert.deepEqual(sent,['one','one','two']);
});
