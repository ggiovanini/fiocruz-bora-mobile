const {test}=require('node:test');const assert=require('node:assert/strict');const {readFileSync}=require('node:fs');const Module=require('node:module');const ts=require('typescript');
const m=new Module('progressArc');m._compile(ts.transpileModule(readFileSync('src/features/avatar/progressArc.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,'progressArc.cjs');const {progressArcs}=m.exports;
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9);
test('both energies start at the base and advance through the left side',()=>{
 const a=progressArcs(40,25);
 close(a.track.start,-Math.PI/2);
 assert.ok(a.track.sweep<0);
 close(a.physical.start,a.track.start);close(a.mental.start,a.track.start);
 close(a.physical.sweep,a.track.sweep*.40);close(a.mental.sweep,a.track.sweep*.25);
 // The first quarter of the path is in the lower-left quadrant.
 const angle=a.physical.start+a.track.sweep*.25;
 assert.ok(Math.cos(angle)<0);assert.ok(Math.sin(angle)<0);
 for(const [g,b] of [[100,0],[0,100],[180,20]]){
  const a=progressArcs(g,b);close(a.physical.sweep+a.mental.sweep,a.track.sweep);
 }
});
test('empty and invalid energy leave the goal path visible without colored arcs',()=>{
 for(const [g,b] of [[0,0],[-10,-5],[NaN,Infinity]]){
  const a=progressArcs(g,b);close(a.physical.sweep,0);close(a.mental.sweep,0);
  assert.ok(Number.isFinite(a.track.sweep));
 }
});

test('white goal arc follows combined energy and closes the circle at 100 percent',()=>{
 close(progressArcs(40,25).goal.sweep,-Math.PI*2*.65);
 close(progressArcs(0,0).goal.sweep,0);
 for(const [g,b] of [[50,50],[100,0],[0,100],[180,20]]) {
  close(progressArcs(g,b).goal.sweep,-Math.PI*2);
 }
});
