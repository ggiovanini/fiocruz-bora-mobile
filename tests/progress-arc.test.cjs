const {test}=require('node:test');const assert=require('node:assert/strict');const {readFileSync}=require('node:fs');const Module=require('node:module');const ts=require('typescript');
const m=new Module('progressArc');m._compile(ts.transpileModule(readFileSync('src/features/avatar/progressArc.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,'progressArc.cjs');const {progressArcs}=m.exports;
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9);
test('physical fills from the left and mental from the right, keeping remaining progress between them',()=>{
 const a=progressArcs(40,25);close(a.mental.start,a.track.start);close(a.physical.start+a.physical.sweep,a.track.start+a.track.sweep);
 close(a.physical.start-(a.mental.start+a.mental.sweep),a.track.sweep*.35);
 const full=progressArcs(50,50);close(full.physical.start,Math.PI/2);close(full.mental.start+full.mental.sweep,Math.PI/2);
 for(const [g,b] of [[100,0],[0,100],[180,20]]){const a=progressArcs(g,b);close(a.physical.sweep+a.mental.sweep,a.track.sweep);}
 const empty=progressArcs(0,0);close(empty.physical.sweep,0);close(empty.mental.sweep,0);
});
