const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const Module=require('node:module');
const ts=require('typescript');
function load(file, mocks={}) {
 const m=new Module(file); m.paths=module.paths;
 const normal=m.require.bind(m);m.require=name=>name in mocks?mocks[name]:normal(name);
 m._compile(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,file+'.cjs');
 return m.exports;
}
const model=load('src/features/challenges/model.ts');
const {ChallengeCard,ChallengeDetail}=load('src/features/challenges/ChallengeViews.tsx',{
 'react-native':{Pressable:'Pressable',Text:'Text',View:'View',StyleSheet:{create:s=>s}},
 '@/design/Icon':{Icon:'Icon'}, '@/design/tokens':{colors:{}},
 '@/ui/Flow':{Button:'Button',Card:'Card',Copy:'Copy',Notice:'Notice'},
 '@/ui/Sheet':{Sheet:'Sheet'}, '../MedalBadge':{MedalBadge:'MedalBadge'},'./model':model,
});
// Resolve local presentational components so private model props are not mistaken for rendered UI.
function renderedTree(element) {
 if (Array.isArray(element)) return element.map(renderedTree);
 if (!element || typeof element !== 'object' || !element.props) return element;
 if (typeof element.type === 'function') return renderedTree(element.type(element.props));
 return {type:element.type,props:{...element.props,children:renderedTree(element.props.children)}};
}
const challenge={id:'one',title:'Desafio',description:'Descrição',metric:'ev',target:100,progress:10,progress_percent:10,starts_on:'2026-11-01',ends_on:'2026-11-30',period_status:'active',completed:false,medal:{name:'Medalha secreta',description:'Detalhe secreto',image_url:'https://example.com/secret-medal.png',style:'movement',earned:false}};
test('unearned rewards never render or request the actual medal in list or detail',()=>{
 for(const tree of [ChallengeCard({challenge,onPress(){}}),ChallengeDetail({challenge,onClose(){},onRegister(){}})]) {
  const rendered=JSON.stringify(renderedTree(tree));
  assert.ok(!rendered.includes('secret-medal.png'));
  assert.ok(!rendered.includes('Medalha secreta'));
  assert.ok(!rendered.includes('Detalhe secreto'));
  assert.ok(!rendered.includes('MedalBadge'));
 }
});
test('earned medals are revealed in both views without the duplicate completion notice',()=>{
 const earned={...challenge,completed:true,medal:{...challenge.medal,earned:true}};
 for(const tree of [ChallengeCard({challenge:earned,onPress(){}}),ChallengeDetail({challenge:earned,onClose(){},onRegister(){},onMedals(){}})]) {
  const rendered=JSON.stringify(renderedTree(tree));
  assert.ok(rendered.includes('secret-medal.png'));
  assert.ok(rendered.includes('MedalBadge'));
  assert.ok(!rendered.includes('Objetivo alcançado.'));
 }
});
const {pagedResourceUrl}=load('src/api/pagination.ts');
test('pagination preserves encoded search query instead of appending a second question mark',()=>{
 assert.equal(pagedResourceUrl('/challenges',2),'/challenges?page=2');
 assert.equal(pagedResourceUrl('/challenges?q=corpo%20%26%20mente',3),'/challenges?q=corpo%20%26%20mente&page=3');
});
