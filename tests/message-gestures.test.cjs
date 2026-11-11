const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const Module=require('node:module');
const ts=require('typescript');
function harness({read=false,busy=false,onDismiss=async()=>{}}={}) {
 let gesture,reads=0;
 const mocks={
  react:{useRef:value=>({current:value}),useState:value=>[value,()=>{}],useMemo:fn=>fn()},
  'react-native':{Animated:{Value:class{setValue(){}},View:'AnimatedView',spring:()=>({start(){}})},PanResponder:{create:handlers=>{gesture=handlers;return {panHandlers:{}};}},Pressable:'Pressable',Text:'Text',View:'View',StyleSheet:{create:s=>s}},
  '@/design/Icon':{Icon:'Icon'},'@/design/tokens':{colors:{}},
 };
 const m=new Module('message-row');m.paths=module.paths;
 const normal=m.require.bind(m);m.require=name=>name in mocks?mocks[name]:normal(name);
 m._compile(ts.transpileModule(readFileSync('src/features/notifications/MessageRow.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,'message-row.cjs');
 const tree=m.exports.MessageRow({message:{id:'one',title:'Aviso',body:'Mensagem',read_at:read?'2026-11-09T12:00:00Z':null},busy,onRead:()=>reads++,onDismiss});
 const main=tree.props.children[1].props.children;
 return {gesture,main,reads:()=>reads};
}
test('vertical scrolling, short movements and cancelled swipes never remove a message',()=>{
 let removed=0;const h=harness({onDismiss:async()=>removed++});
 assert.equal(h.gesture.onMoveShouldSetPanResponder(null,{dx:-25,dy:80}),false);
 assert.equal(h.gesture.onMoveShouldSetPanResponder(null,{dx:-5,dy:0}),false);
 assert.equal(h.gesture.onMoveShouldSetPanResponder(null,{dx:-60,dy:5}),true);
 h.gesture.onPanResponderRelease(null,{dx:-60,dy:5});
 h.gesture.onPanResponderTerminate();
 assert.equal(removed,0);
});
test('full swipe requests one dismissal while an operation is pending',async()=>{
 let removed=0,finish;
 const h=harness({onDismiss:()=>{removed++;return new Promise(resolve=>{finish=resolve;});}});
 h.gesture.onPanResponderRelease(null,{dx:-130,dy:0});
 h.gesture.onPanResponderRelease(null,{dx:-130,dy:0});
 assert.equal(removed,1);
 finish();await Promise.resolve();
});
test('tap marks unread messages only and removal has an accessible alternative',async()=>{
 const unread=harness();unread.main.props.onPress();assert.equal(unread.reads(),1);
 const read=harness({read:true});read.main.props.onPress();assert.equal(read.reads(),0);
 let removed=0;const accessible=harness({onDismiss:async()=>removed++});
 accessible.main.props.onAccessibilityAction({nativeEvent:{actionName:'remove'}});
 assert.equal(removed,1);
 const busy=harness({busy:true,onDismiss:async()=>removed++});
 assert.equal(busy.main.props.disabled,true);
 assert.equal(busy.gesture.onMoveShouldSetPanResponder(null,{dx:-130,dy:0}),false);
 busy.main.props.onAccessibilityAction({nativeEvent:{actionName:'remove'}});
 assert.equal(removed,1);
});
