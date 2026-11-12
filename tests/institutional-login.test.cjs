const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const crypto=require('node:crypto');
const state='a'.repeat(64),code='c'.repeat(64);
function setup({platform='ios',base='https://bora.dmgn.com.br/api/v1',result}={}){
 const exports={}, browser=[];
 const bridge={getRandomBytesAsync:async count=>crypto.randomBytes(count),randomUUID:()=>crypto.randomUUID(),CryptoDigestAlgorithm:{SHA256:'sha256'},CryptoEncoding:{BASE64:'base64'},digestStringAsync:async(_,value)=>crypto.createHash('sha256').update(value).digest('base64')};
 vm.runInNewContext(ts.transpileModule(readFileSync('src/api/institutionalLogin.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{
  exports,URL,require:name=>name==='react-native'?{Platform:{OS:platform}}:name==='expo-crypto'?bridge:name==='./config'?{getApiBaseUrl:()=>base}:{openAuthSessionAsync:async(url,redirect)=>{browser.push([url,redirect]);return result??{type:'success',url:`${redirect}?code=${code}&state=${browser.state}`}}},
 });
 return {api:exports,browser};
}
test('callback accepts only its exact target, state and one disposable code',()=>{
 const {api}=setup();
 assert.equal(api.validateInstitutionalReturn(`bora://auth/fiocruz?state=${state}&code=${code}`,state),code);
 for(const url of [`https://attacker.example?state=${state}&code=${code}`,`bora://auth/other?state=${state}&code=${code}`,`bora://auth/fiocruz?state=other&code=${code}`,`bora://auth/fiocruz?state=${state}&code=${code}&code=${code}`,`bora://auth/fiocruz?state=${state}&error=login_failed`])assert.throws(()=>api.validateInstitutionalReturn(url,state));
});
test('native login binds exchange to the original verifier and sends no institutional secrets',async()=>{
 const {api,browser}=setup();let challenge,installation;const calls=[];
 const value=await api.institutionalLogin(async(path,init)=>{
  calls.push(path);const body=JSON.parse(init.body);
  if(path.endsWith('/start')){challenge=body.challenge;installation=body.installation_id;browser.state=body.state;assert.equal(body.platform,'ios');assert.equal(body.client_secret,undefined);return {data:{authorize_url:'https://bora.dmgn.com.br/auth/fiocruz/redirect?attempt=abc'}};}
  assert.equal(crypto.createHash('sha256').update(body.verifier).digest('base64url'),challenge);
  assert.equal(body.code,code);return {data:{token:'local-token',installation_id:installation}};
 });
 assert.equal(value.token,'local-token');assert.equal(browser[0][1],'bora://auth/fiocruz');assert.deepEqual(calls,['/auth/fiocruz/start','/auth/fiocruz/exchange']);
});
test('unapproved environments, web, cancellation and forged authorization URLs cannot issue tokens',async()=>{
 for(const settings of [{platform:'web'},{base:'https://production.example/api/v1'},{base:'http://localhost/api/v1'}]){
  const {api}=setup(settings);await assert.rejects(api.institutionalLogin(async()=>{assert.fail('No request expected')}));
 }
 const {api}=setup({result:{type:'cancel'}});let calls=0;
 await assert.rejects(api.institutionalLogin(async()=>{calls++;return {data:{authorize_url:'https://bora.dmgn.com.br/auth/fiocruz/redirect'}}}),/cancelado/);assert.equal(calls,1);
 const forged=setup();await assert.rejects(forged.api.institutionalLogin(async()=>({data:{authorize_url:'https://attacker.example/redirect'}})),/inválido/);assert.equal(forged.browser.length,0);
});
