const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const m = new Module('activity-catalog');
m._compile(ts.transpileModule(readFileSync('src/features/activity/catalog.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,'activity-catalog.cjs');
const { supportsEnergy, recentDates } = m.exports;
test('API scoring dimension wins over discovery group when displaying the two activity lists',()=>{
 assert.equal(supportsEnergy({energy_dimension:'intellectual',discovery_group:'movement'},'physical'),false);
 assert.equal(supportsEnergy({energy_dimension:'intellectual',discovery_group:'movement'},'intellectual'),true);
 assert.equal(supportsEnergy({energy_dimension:'physical',discovery_group:'wellbeing'},'physical'),true);
 assert.equal(supportsEnergy({energy_dimension:'physical',discovery_group:'wellbeing'},'intellectual'),false);
});
test('choice activities remain available in either energy, without introducing a third category',()=>{
 for(const kind of ['physical','intellectual']) assert.equal(supportsEnergy({energy_dimension:'choice',discovery_group:'wellbeing'},kind),true);
 assert.equal(supportsEnergy({energy_dimension:null,discovery_group:'mind'},'physical'),false);
 assert.equal(supportsEnergy({energy_dimension:null,discovery_group:'movement'},'physical'),true);
});
test('date choices follow the API window across month and year boundaries, never including future dates',()=>{
 assert.deepEqual(recentDates('2027-01-02',3),['2027-01-02','2027-01-01','2026-12-31']);
 assert.equal(recentDates('2026-11-09',7).at(-1),'2026-11-03');
 assert.equal(recentDates('2026-11-09',30).length,7);
 assert.deepEqual(recentDates('2026-11-09',1),['2026-11-09']);
});
const messages = new Module('registrationMessage');
messages._compile(ts.transpileModule(readFileSync('src/features/activity/registrationMessage.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,'registrationMessage.cjs');
const { registrationMessage } = messages.exports;
test('celebration never claims server points while a registration is queued or awaiting validation',()=>{
 const activity={status:'pending',awardedEv:100};
 assert.equal(registrationMessage(activity,true),'Salvo. Aguardando envio.');
 assert.equal(registrationMessage({...activity,status:'sending'},true),'Enviando seu registro…');
 assert.equal(registrationMessage({...activity,status:'confirmed',validationStatus:'pending'},true),'Registrado. Aguardando validação.');
 assert.equal(registrationMessage({...activity,status:'confirmed',validationStatus:'approved'},true),'Atividade registrada · 100 EV');
 assert.equal(registrationMessage(activity,false),'Registro salvo neste aparelho.');
});
