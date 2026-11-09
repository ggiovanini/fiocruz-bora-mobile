const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const Module=require('node:module');
const ts=require('typescript');
const file='src/features/permissions/introStorage.ts';
const mod=new Module(file);
mod._compile(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
const {permissionIntroKey,readPermissionChoices,nextPermissionStep,finishPermissionExplanation}=mod.exports;
function storage(){const values=new Map();return {values,getItem:async key=>values.get(key)??null,setItem:async(key,value)=>values.set(key,value)};}

test('first use explains notifications and camera in order; leaving either for later prevents repeat intros',async()=>{
 const store=storage();
 assert.equal(nextPermissionStep(await readPermissionChoices(store)),'notifications');
 await finishPermissionExplanation(store,'notifications');
 assert.equal(nextPermissionStep(await readPermissionChoices(store)),'camera');
 await finishPermissionExplanation(store,'camera');
 assert.equal(nextPermissionStep(await readPermissionChoices(store)),null);
 // Reloading or switching accounts on this device never resets an explanation decision.
 assert.equal(nextPermissionStep(await readPermissionChoices(store)),null);
 assert.deepEqual(JSON.parse(store.values.get(permissionIntroKey)),{notifications:true,camera:true});
});
test('an interrupted system prompt preserves its completed explanation but leaves the other permission for next time',async()=>{
 const store=storage();
 await finishPermissionExplanation(store,'notifications');
 assert.equal(nextPermissionStep(await readPermissionChoices(store)),'camera');
 await finishPermissionExplanation(store,'notifications');
 assert.equal(nextPermissionStep(await readPermissionChoices(store)),'camera');
});
test('corrupt data or string booleans never skip an unexplained permission, and failed saves do not claim success',async()=>{
 const store=storage();store.values.set(permissionIntroKey,'broken');
 assert.equal(nextPermissionStep(await readPermissionChoices(store)),'notifications');
 store.values.set(permissionIntroKey,JSON.stringify({notifications:'true',camera:true}));
 assert.equal(nextPermissionStep(await readPermissionChoices(store)),'notifications');
 const failing={...store,setItem:async()=>{throw new Error('storage unavailable');}};
 await assert.rejects(finishPermissionExplanation(failing,'notifications'),/storage unavailable/);
 assert.equal(nextPermissionStep(await readPermissionChoices(store)),'notifications');
});
