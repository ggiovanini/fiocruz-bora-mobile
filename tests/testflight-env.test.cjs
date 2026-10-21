const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {readApiUrl} = require('../scripts/testflight-env.cjs');

test('Archive accepts an external HTTPS API and rejects missing, local or invalid settings', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bora-api-env-'));
  const file=path.join(dir,'.env.testflight');
  try {
    assert.throws(()=>readApiUrl(file));
    for(const url of ['', 'http://api.example.com/api/v1','https://localhost/api/v1','https://192.168.1.3/api/v1','https://api.example.com','https://api.example.com/api/v1?key=secret']) {
      fs.writeFileSync(file,`EXPO_PUBLIC_API_URL=${url}\n`);
      assert.throws(()=>readApiUrl(file));
    }
    fs.writeFileSync(file,'EXPO_PUBLIC_API_URL="https://api.example.com/api/v1/"\n');
    assert.equal(readApiUrl(file),'https://api.example.com/api/v1');
    const script=path.resolve(__dirname,'../scripts/xcode-api-env.sh');
    fs.mkdirSync(path.join(dir,'scripts'));fs.copyFileSync(path.resolve(__dirname,'../scripts/testflight-env.cjs'),path.join(dir,'scripts/testflight-env.cjs'));
    // Resolve dotenv through the project dependencies while using an isolated env file.
    const env={...process.env,CONFIGURATION:'Release',NODE_BINARY:process.execPath,PROJECT_ROOT:dir,NODE_PATH:path.resolve(__dirname,'../node_modules'),EXPO_PUBLIC_API_URL:'http://localhost:8000/api/v1'};
    const release=spawnSync('/bin/bash',['-c','source "$1"; printf "%s" "$EXPO_PUBLIC_API_URL"','test',script],{env,encoding:'utf8'});
    assert.equal(release.status,0,release.stderr);assert.ok(release.stdout.endsWith('https://api.example.com/api/v1'));
    const debug=spawnSync('/bin/bash',['-c','source "$1"; printf "%s" "$EXPO_PUBLIC_API_URL"','test',script],{env:{...env,CONFIGURATION:'Debug'},encoding:'utf8'});
    assert.equal(debug.stdout,'http://localhost:8000/api/v1');
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
