const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const m = new Module('celebrations');
m._compile(ts.transpileModule(readFileSync('src/features/celebrations/model.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, 'celebrations.cjs');
const { closingWord, unseen, celebrationDate } = m.exports;
test('closing words remain valid at random boundaries and avoid the preceding word', () => {
 for (const previous of ['Incrível!', 'Demais!', 'Mandei bem!', 'Arrasei!', 'Boa!']) {
  for (const random of [0,.2,.5,.999999]) assert.notEqual(closingWord(previous,()=>random), previous);
 }
 assert.equal(closingWord(undefined,()=>0),'Incrível!');
});
test('server replay and local closed receipts cannot duplicate pending celebrations', () => {
 const list=[{id:'1'},{id:'2'},{id:'2'},{id:'3'}];
 assert.deepEqual(unseen(list,['1','3']).map(x=>x.id),['2']);
 assert.deepEqual(unseen(list,['1','2','3']),[]);
});
test('retroactive dates retain the correct calendar day', () => {
 assert.match(celebrationDate('2026-11-08'),/8 de novembro de 2026/);
});

test('iPhone presentation waits for route replacement and cancels obsolete navigation timers', () => {
 let value=null, effect, previousDeps, cleanup;
 const scheduled=new Map();let counter=0;
 const hookModule=new Module('presentation-ready');
 hookModule.require=name=>{
  if(name==='react')return {
   useState:()=>[value,next=>{value=next;}],
   useEffect:(run,deps)=>{
    if(!previousDeps||deps.some((d,i)=>d!==previousDeps[i])) {
     cleanup?.();previousDeps=deps;effect=run;
    }
   },
  };
  throw new Error(name);
 };
 const source=ts.transpileModule(readFileSync('src/features/celebrations/usePresentationReady.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const run=new Function('require','exports','setTimeout','clearTimeout',source);
 run(hookModule.require,hookModule.exports,(fn,delay)=>{assert.equal(delay,600);scheduled.set(++counter,fn);return counter;},id=>scheduled.delete(id));
 const render=(path,enabled)=>{
  const result=hookModule.exports.usePresentationReady(path,enabled);
  if(effect){const next=effect;effect=null;cleanup=next();}
  return result;
 };
 assert.equal(render('/activity-result',false),false);
 assert.equal(render('/home',true),false);
 assert.equal(scheduled.size,1);
 assert.equal(render('/events',true),false);
 assert.equal(scheduled.size,1,'old route timer must be cancelled');
 for(const fn of [...scheduled.values()])fn();scheduled.clear();
 assert.equal(render('/events',true),true);
 assert.equal(render('/events',false),false,'background app cannot present');
 assert.equal(render('/events',true),false,'foreground return waits again');
 cleanup?.();assert.equal(scheduled.size,0);
});
