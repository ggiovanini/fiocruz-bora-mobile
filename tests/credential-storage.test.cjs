const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function setup(platform){
 const calls=[],secure=new Map(),exports={};
 vm.runInNewContext(ts.transpileModule(readFileSync('src/api/credentialStorage.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{
  exports,require:name=>name==='react-native'?{Platform:{OS:platform}}:{WHEN_UNLOCKED_THIS_DEVICE_ONLY:'device-only',
   getItemAsync:async key=>{calls.push('get');return secure.get(key)??null;},
   setItemAsync:async(key,value,options)=>{assert.equal(options.keychainAccessible,'device-only');calls.push('set');secure.set(key,value);},
   deleteItemAsync:async key=>{calls.push('remove');secure.delete(key);},
  },
 });return {storage:exports.credentialStorage,calls};
}
test('iOS and Android store credentials in device-only secure storage and remove them on logout',async()=>{
 for(const platform of ['ios','android']){
  const {storage,calls}=setup(platform);await storage.set('secret-token');assert.equal(await storage.get(),'secret-token');await storage.remove();assert.equal(await storage.get(),null);assert.deepEqual(calls,['set','get','remove','get']);
 }
});
test('web previews keep only memory state and never invoke the native keychain',async()=>{
 const {storage,calls}=setup('web');await storage.set('preview');assert.equal(await storage.get(),'preview');await storage.remove();assert.equal(await storage.get(),null);assert.deepEqual(calls,[]);assert.equal(await setup('web').storage.get(),null);
});
