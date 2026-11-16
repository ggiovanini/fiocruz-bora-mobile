const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const Module=require('node:module');
const ts=require('typescript');
function load(file){const mod=new Module(file);mod._compile(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);return mod.exports;}
const {resolveWorkoutActivity}=load('src/health/workoutMapping.ts');
const {savedActivityNames}=load('src/features/activity/savedNames.ts');
const catalog=[['walking','Caminhada'],['running','Corrida'],['swimming','Natação'],['workout','Treino'],['other','Outras atividades físicas']].map(([code,name])=>({code,name,requires_custom_name:code==='other',energy_dimension:'physical',scoring_status:'configured'}));
test('device titles match complete words and prefer specific categories over generic training',()=>{
 for(const [name,code] of [['Treino de NATAÇÃO na piscina','swimming'],['Caminhada no parque','walking'],['Morning running','running'],['Treino de força','workout'],['Tênis com amigos','other'],['Corredor novo','other']]){
  assert.equal(resolveWorkoutActivity({name,kind:'Outro treino'},catalog).code,code);
 }
});
test('native modality is retained without a title and resolves ambiguous compound titles',()=>{
 assert.equal(resolveWorkoutActivity({kind:'Musculação'},catalog).code,'workout');
 assert.equal(resolveWorkoutActivity({kind:'Caminhada'},catalog).code,'walking');
 assert.equal(resolveWorkoutActivity({name:'Corrida e caminhada',kind:'Corrida'},catalog).code,'running');
 assert.equal(resolveWorkoutActivity({name:'Corrida e caminhada',kind:'Outro treino'},catalog).code,'other');
 assert.equal(resolveWorkoutActivity({name:'Corrida',kind:'Outro treino'},catalog.map(item=>({...item,scoring_status:'not_configured'}))),undefined);
});
test('manual suggestions include earlier custom/imported names only for the chosen category and ignore duplicates and unconfirmed rows',()=>{
 const item=catalog[0];
 const history=[
  {type:'Caminhada no parque',activityCode:'walking',status:'confirmed',createdAt:'2026-11-16'},
  {type:'Não enviado',activityCode:'walking',status:'pending',createdAt:'2026-11-17'},
  {type:'Recusado',activityCode:'walking',status:'confirmed',validationStatus:'rejected',createdAt:'2026-11-17'},
 ];
 const saved=[{name:'CAMINHADA NO PARQUE',activity_type:'walking'},{name:'Caminhada na praia',activity_type:'walking'},{name:'Caminhada',activity_type:'walking'},{name:'Corrida longa',activity_type:'running'}];
 assert.deepEqual(savedActivityNames(item,saved,history),['Caminhada no parque','Caminhada na praia']);
 assert.deepEqual(savedActivityNames(item,[],[]),[]);
});
