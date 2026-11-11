const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const Module=require('node:module');
const ts=require('typescript');
test('workout preview shows all scenarios and simulates submission without depending on API or health providers',async()=>{
 const slots=[];
 const mocks={react:{useState:initial=>{const i=slots.length;slots.push(typeof initial==='function'?initial():initial);return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},useRef:initial=>({current:initial}),useEffect:()=>{}},
  'react-native':{Platform:{OS:'ios'}},'@/ui/Flow':{Button:'Button',Copy:'Copy',Notice:'Notice'},'@/ui/ListScreen':{ListScreen:'ListScreen'},'./WorkoutImportView':{WorkoutImportView:'WorkoutImportView'},
 };
 const file='src/features/health/HealthPreview.tsx';const m=new Module(file);m.paths=module.paths;
 m.require=name=>name in mocks?mocks[name]:name==='react/jsx-runtime'?require(name):(()=>{throw new Error(`Unexpected preview dependency: ${name}`);})();
 m._compile(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,file);
 const tree=m.exports.default();
 const rows=tree.props.children.flat().filter(child=>child?.type==='WorkoutImportView');
 assert.equal(rows.length,4);
 assert.deepEqual(rows.map(row=>row.props.entry.status),['imported','sending','failed','review']);
 assert.ok(rows.every(row=>row.props.illustrative));
 await rows[2].props.onSend('cycling');
 assert.deepEqual(slots[1].bike,{status:'imported',awardedEv:45});
});
