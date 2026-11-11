const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const {patch}=require('../scripts/patch-react-native-core.cjs');
const source=fs.readFileSync('node_modules/react-native/scripts/replace-rncore-version.js','utf8');
function selector(marker){
 const body=patch(source).split('// This script is executed in the Pods folder')[0];
 const context={require:name=>name==='fs'?{existsSync:()=>marker!==null,readFileSync:()=>Buffer.from(marker)}:require(name),console:{log:()=>{}},module:{exports:{}}};
 vm.runInNewContext(body+'\nmodule.exports=shouldReplaceRnCoreConfiguration;',context);return context.module.exports;
}
test('missing React Native framework marker restores both Debug and Release; known matching artifacts are reused',()=>{
 assert.equal(selector(null)('Debug'),true);assert.equal(selector(null)('Release'),true);
 assert.equal(selector('Debug')('Debug'),false);assert.equal(selector('Release')('Release'),false);
 assert.equal(selector('Release')('Debug'),true);assert.equal(selector('Debug')('Release'),true);
 assert.equal(patch(patch(source)),patch(source));assert.throws(()=>patch('// changed upstream script'),/Review/);
});
