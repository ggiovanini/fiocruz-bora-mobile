const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const Module=require('node:module');
const ts=require('typescript');
function load(file,mocks={}) {
 const m=new Module(file);m.paths=module.paths;
 const normal=m.require.bind(m);m.require=name=>name in mocks?mocks[name]:normal(name);
 m._compile(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,file+'.cjs');
 return m.exports;
}
const model=load('src/features/events/model.ts');
let failedUrl=null;
const {EventCard,EventDetailContent}=load('src/features/events/EventViews.tsx',{
 react:{...require('react'),useState:()=>[failedUrl,()=>{}]},
 'react-native':{Image:'Image',Pressable:'Pressable',Text:'Text',View:'View',StyleSheet:{create:s=>s}},
 '@/design/Icon':{Icon:'Icon'},'@/design/tokens':{colors:{}},
 '@/ui/Sheet':{Sheet:'Sheet'},
 '@/ui/Flow':{Button:'Button',Card:'Card',Copy:'Copy',Notice:'Notice'},'../MedalBadge':{MedalBadge:'MedalBadge'},'./model':model,
});
function tree(element) {
 if(Array.isArray(element)) return element.map(tree);
 if(!element||typeof element!=='object'||!element.props) return element;
 if(typeof element.type==='function') return tree(element.type(element.props));
 return {type:element.type,props:{...element.props,children:tree(element.props.children)}};
}
function nodes(element,type) {
 if(Array.isArray(element)) return element.flatMap(value=>nodes(value,type));
 if(!element||typeof element!=='object'||!element.props) return [];
 return [...(element.type===type?[element]:[]),...nodes(element.props.children,type)];
}
const event={id:'event',title:'Encontro',description:'Descrição completa no detalhe',location:'Auditório',qr_instructions:'QR na recepção',starts_at:'2026-11-09T12:00:00Z',ends_at:'2026-11-09T14:00:00Z',active:true,checked_in:false};
test('presence status takes precedence over an ended period and dates use Brasilia time',()=>{
 assert.equal(model.eventStatus({...event,checked_in:true,active:false},Date.parse('2026-11-10')),'Presença confirmada');
 assert.equal(model.eventStatus(event),'Em andamento');
 assert.equal(model.eventStatus({...event,active:false},Date.parse('2026-11-10')),'Encerrado');
 assert.equal(model.eventStatus({...event,active:false},Date.parse('2026-11-01')),'Em breve');
 assert.ok(model.eventPeriod(event).includes('09:00'));
 assert.equal(model.eventPeriod({...event,starts_at:null,ends_at:null}),'Data e horário a definir');
});
test('event cards keep the cover slot for missing or failed images',()=>{
 for(const image of [undefined,'https://example.com/cover.png']) {
  failedUrl=image??null;
  const rendered=tree(EventCard({event:{...event,image_url:image},onPress(){}}));
  assert.equal(nodes(rendered,'Image').length,0);
  assert.ok(nodes(rendered,'View').some(node=>node.props.accessibilityLabel?.includes('sem imagem disponível')));
 }
 failedUrl=null;
 const rendered=tree(EventCard({event:{...event,image_url:'https://example.com/valid.png'},onPress(){}}));
 assert.equal(nodes(rendered,'Image').length,1);
 assert.ok(!JSON.stringify(rendered).includes(event.description));
 assert.ok(!JSON.stringify(rendered).includes(event.qr_instructions));
});
test('detail offers check-in only for active events without confirmed presence',()=>{
 const render=value=>tree(EventDetailContent({event:value,onCheckIn(){},onMedals(){}}));
 const labels=value=>nodes(render(value),'Button').map(node=>node.props.title);
 assert.ok(labels(event).includes('Registrar presença'));
 assert.ok(!labels({...event,active:false}).includes('Registrar presença'));
 assert.ok(!labels({...event,checked_in:true}).includes('Registrar presença'));
 assert.ok(JSON.stringify(render(event)).includes(event.description));
 assert.ok(JSON.stringify(render(event)).includes(event.qr_instructions));
});
