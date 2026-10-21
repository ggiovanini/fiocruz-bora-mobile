const {test}=require('node:test');const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');const Module=require('node:module');const ts=require('typescript');
const mod=new Module('notice');mod._compile(ts.transpileModule(readFileSync('src/notifications/notice.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,'notice.cjs');
const {isNewNotice}=mod.exports;
test('notification watermark avoids duplicates and older unread messages after the newest is read',()=>{
 const first={id:'b',created_at:'2026-10-21T15:00:00Z'};
 assert.equal(isNewNotice(null,first),true);
 assert.equal(isNewNotice(first,first),false);
 assert.equal(isNewNotice(first,null),false);
 assert.equal(isNewNotice(first,{id:'a',created_at:first.created_at}),false);
 assert.equal(isNewNotice(first,{id:'c',created_at:first.created_at}),true);
 assert.equal(isNewNotice(first,{id:'a',created_at:'2026-10-21T15:01:00Z'}),true);
 assert.equal(isNewNotice(first,{id:'z',created_at:'2026-10-20T15:00:00Z'}),false);
});
