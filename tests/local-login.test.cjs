const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function setup({dev=true,enabled='true',base='http://localhost:8000/api/v1'}={}){
 const exports={};
 vm.runInNewContext(ts.transpileModule(readFileSync('src/api/localLogin.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{
  exports,URL,__DEV__:dev,process:{env:{EXPO_PUBLIC_LOCAL_LOGIN_ENABLED:enabled}},
  require:name=>name==='./config'?{getApiBaseUrl:()=>base}:name==='expo-crypto'?{randomUUID:()=> 'installation-id'}:{Platform:{OS:'ios'}},
 });
 return exports;
}
test('explicit development opt-in permits loopback, emulator and private LAN APIs',async()=>{
 for(const base of ['http://localhost:8000/api/v1','http://10.0.2.2:8000/api/v1','http://192.168.1.10:8000/api/v1','http://172.16.1.3/api/v1','http://[::1]:8000/api/v1']){
  const api=setup({base});assert.equal(api.useLocalLogin(),true);
  const session=await api.localLogin(async(path,init)=>{
   assert.equal(path,'/auth/test-login');assert.equal(init.method,'POST');
   return {data:{token:'demo-token',expires_at:'future',user:{id:'demo'}}};
  });
  assert.equal(session.token,'demo-token');assert.equal(session.installation_id,'installation-id');
 }
});
test('release builds and online or malformed addresses cannot request demo tokens',async()=>{
 for(const settings of [{dev:false},{base:'https://bora.dmgn.com.br/api/v1'},{base:'https://production.example/api/v1'},{base:'http://localhost.attacker.example/api/v1'},{base:'http://172.32.0.1/api/v1'},{base:'invalid'}]){
  const api=setup(settings);assert.throws(()=>api.useLocalLogin());
  await assert.rejects(api.localLogin(async()=>assert.fail('No request expected')));
 }
});
test('default login stays institutional and demo errors never invoke another login',async()=>{
 for(const enabled of [null, '', 'false']){
  const api=setup({enabled});assert.equal(api.useLocalLogin(),false);
  await assert.rejects(api.localLogin(async()=>assert.fail('No request expected')));
 }
 const api=setup();let calls=0;
 await assert.rejects(api.localLogin(async()=>{calls++;throw new Error('API refused')}),/API refused/);
 assert.equal(calls,1);
});
