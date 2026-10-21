const {test}=require('node:test');const assert=require('node:assert/strict');const {readFileSync}=require('node:fs');const Module=require('node:module');const ts=require('typescript');
function load(file,stubs){const m=new Module(file);m.require=name=>Object.hasOwn(stubs,name)?stubs[name]:require(name);m._compile(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,file);return m.exports;}
function harness(){
 let user='alice',index=0,answer={unread_count:1,latest_unread:{id:'b',created_at:'2026-10-21T15:00:00Z'}},request=async()=>answer;
 const slots=[],store=new Map([['bora:notification-opt-in:v1:alice','true'],['bora:notification-opt-in:v1:bob','true']]),sent=[];
 let permitted=true;
 const react={createContext:()=>({Provider:'provider'}),useContext:()=>{},useCallback:fn=>fn,useEffect:()=>{},useRef:value=>{const i=index++;return slots[i]??(slots[i]={current:value});},useState:value=>{const i=index++;if(!(i in slots))slots[i]=value;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];}};
 const notifications={setNotificationHandler:()=>{},getPermissionsAsync:async()=>({granted:permitted}),IosAuthorizationStatus:{PROVISIONAL:3},scheduleNotificationAsync:async content=>{sent.push(content);return 'notice';},dismissNotificationAsync:async()=>{}};
 const {NotificationProvider}=load('src/notifications/NotificationProvider.tsx',{
 'react':react,'react/jsx-runtime':{jsx:(type,props)=>({type,props})},'react-native':{Platform:{OS:'ios'},AppState:{currentState:'active'}},
 '@react-native-async-storage/async-storage':{getItem:async key=>store.get(key)??null,setItem:async(key,value)=>{store.set(key,value);},removeItem:async key=>{store.delete(key);}},
 'expo-notifications':notifications,'expo-router':{useRouter:()=>({push:()=>{}}),useRootNavigationState:()=>({key:'root'})},'@/api/session':{apiEnabled:true,apiRequest:()=>request()},
 '@/mocks/MockProvider':{useMock:()=>({state:{userId:user},ready:true}),hasAccess:()=>!!user},'./notice':load('src/notifications/notice.ts',{})});
 return {render:()=>{index=0;return NotificationProvider({children:null}).props.value;},sent,store,setUser:id=>{user=id;},setAnswer:value=>{answer=value;},setRequest:fn=>{request=fn;},deny:()=>{permitted=false;}};
}
test('API polling presents one generic system notice, keeps messages unread, and deduplicates persisted cursor',async()=>{
 const h=harness();await h.render().refresh();await h.render().refresh();
 assert.equal(h.sent.length,1);assert.equal(h.render().unread,1);
 assert.equal(h.sent[0].content.data.userId,'alice');assert.equal(h.sent[0].content.title,'Bóra');
 assert.equal(h.sent[0].content.body.includes('Abra sua caixa'),true);
 h.setAnswer({unread_count:0,latest_unread:null});await h.render().refresh();assert.equal(h.render().unread,0);assert.equal(h.sent.length,1);
});
test('denied permission and disabled per-account preference preserve inbox without system notices',async()=>{
 const h=harness();h.deny();await h.render().refresh();assert.equal(h.sent.length,0);assert.equal(h.render().unread,1);
 const other=harness();await other.render().disable();await other.render().refresh();assert.equal(other.sent.length,0);assert.equal(other.render().unread,1);
});
test('a late response from an earlier login cannot update or notify another session, including A to B to A',async()=>{
 const h=harness();let resolve;h.setRequest(()=>new Promise(r=>{resolve=r;}));const pending=h.render().refresh();
 h.setUser('bob');h.render();h.setUser('alice');h.render();resolve({unread_count:99,latest_unread:{id:'z',created_at:'2026-10-21T16:00:00Z'}});await pending;
 assert.equal(h.sent.length,0);assert.equal(h.render().unread,0);
});
