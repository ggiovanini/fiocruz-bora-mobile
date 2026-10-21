const {test}=require('node:test');const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');const Module=require('node:module');const ts=require('typescript');
const mod=new Module('importPayload');mod._compile(ts.transpileModule(readFileSync('src/health/importPayload.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,'importPayload.cjs');
const {importPayload}=mod.exports;
test('workout import preserves stable source identity and active duration without transmitting steps or device origin',()=>{
 const workout={source:'healthkit',externalId:'same-workout-id',start:'2026-10-21T10:00:00Z',end:'2026-10-21T10:30:00Z',durationMinutes:20,origin:'Private device',steps:1234};
 const a=importPayload(workout,'walking');assert.deepEqual(a,importPayload(workout,'walking'));
 assert.equal(a.duration_seconds,1200);assert.equal(a.source,'apple_health');assert.equal(a.confirmed,true);
 assert.equal(a.origin,undefined);assert.equal(a.steps,undefined);assert.equal(a.user_id,undefined);assert.equal(a.ev,undefined);
 assert.equal(importPayload({...workout,source:'health-connect'},'yoga','physical').energy_dimension,'physical');
 assert.throws(()=>importPayload({...workout,durationMinutes:40},'walking'));
 assert.throws(()=>importPayload({...workout,durationMinutes:0},'walking'));
});
