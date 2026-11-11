const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const Module=require('node:module');
const ts=require('typescript');
const m=new Module('challenge-model');
m._compile(ts.transpileModule(readFileSync('src/features/challenges/model.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,'challenge-model.cjs');
const {canRegisterChallenge,challengeDeadline,challengePercent,challengeProgress,challengeStatus}=m.exports;
const active={period_status:'active',completed:false,starts_on:'2026-11-01',ends_on:'2026-11-30',progress:25,target:100,progress_percent:25,metric:'ev'};
test('registration is offered only for active incomplete challenges, independently of reward delivery',()=>{
 assert.equal(canRegisterChallenge(active),true);
 assert.equal(canRegisterChallenge({...active,completed:true}),false);
 for(const period_status of ['upcoming','ended']) assert.equal(canRegisterChallenge({...active,period_status}),false);
 assert.equal(challengeStatus({...active,completed:true,medal:{earned:false}}),'Concluído');
});
test('upcoming deadlines show the start as well as the end; ended challenges are explicit',()=>{
 assert.equal(challengeDeadline(active),'Até 30/11/2026');
 assert.equal(challengeDeadline({...active,period_status:'upcoming'}),'Começa 01/11/2026 · até 30/11/2026');
 assert.equal(challengeDeadline({...active,period_status:'ended'}),'Encerrado em 30/11/2026');
});
test('progress retains actual values above the target while the bar stays bounded',()=>{
 assert.equal(challengeProgress({...active,progress:120}),'120 / 100 EV');
 assert.equal(challengePercent({...active,progress_percent:120}),100);
 assert.equal(challengePercent({...active,progress_percent:-10}),0);
 assert.equal(challengePercent({...active,progress_percent:NaN}),0);
 assert.equal(challengeProgress({...active,metric:'activities',progress:2,target:5}),'2 / 5 atividades');
 assert.equal(challengeProgress({...active,metric:'activities',progress:1,target:1}),'1 / 1 atividade');
 assert.equal(challengeProgress({...active,metric:'minutes',progress:10,target:30}),'10 / 30 min');
});
