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

test('Android Release overrides both API variables and rejects invalid configuration; Debug preserves local settings', () => {
  const {configureReleaseEnv} = require('../scripts/android-release-cli.cjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bora-android-env-'));
  const file = path.join(dir, '.env.testflight');
  try {
    const env = {EXPO_PUBLIC_API_URL: 'http://localhost:8000/api/v1', EXPO_PUBLIC_ANDROID_API_URL: 'http://10.0.2.2:8000/api/v1', __EXPO_ENV_LOADED: '1'};
    const debug = {...env};
    configureReleaseEnv(['export:embed', '--dev', 'true'], debug, dir);
    assert.deepEqual(debug, env);
    assert.throws(() => configureReleaseEnv(['export:embed', '--dev', 'false'], {...env}, dir));
    fs.writeFileSync(file, 'EXPO_PUBLIC_API_URL=https://api.example.com/api/v1/\n');
    configureReleaseEnv(['export:embed', '--dev', 'false'], env, dir);
    assert.equal(env.EXPO_PUBLIC_API_URL, 'https://api.example.com/api/v1');
    assert.equal(env.EXPO_PUBLIC_ANDROID_API_URL, env.EXPO_PUBLIC_API_URL);
    assert.equal(env.EXPO_NO_DOTENV, '1');
    assert.equal(env.__EXPO_ENV_LOADED, undefined);
    fs.writeFileSync(file, 'EXPO_PUBLIC_API_URL=http://localhost/api/v1\n');
    assert.throws(() => configureReleaseEnv(['export:embed', '--dev', 'false'], env, dir));
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});

test('Android API plugin survives repeated prebuild and tracks release configuration', () => {
  const {configureReleaseApi} = require('../plugins/with-android-release-api');
  const source = fs.readFileSync(path.resolve(__dirname, '../android/app/build.gradle'), 'utf8');
  assert.equal(configureReleaseApi(source), source);
  assert.match(source, /cliFile = file\("\$projectRoot\/scripts\/android-release-cli.cjs"\)/);
  assert.match(source, /inputs.files\(file\("\$projectRoot\/\.env.testflight"\)/);
});

test('iOS API plugin configures the real Xcode parser and remains idempotent', () => {
  const vm = require('node:vm');
  const project = require('xcode').project(path.resolve(__dirname, '../ios/Bra.xcodeproj/project.pbxproj'));
  project.parseSync();
  const phases = project.hash.project.objects.PBXShellScriptBuildPhase;
  const bundle = Object.values(phases).find(phase => phase && typeof phase === 'object' && phase.name?.includes('Bundle React Native'));
  assert.ok(bundle);
  const injection = '\n# BORA_ARCHIVE_ENV\nsource "$PROJECT_ROOT/scripts/xcode-api-env.sh"\n';
  bundle.shellScript = JSON.stringify(JSON.parse(bundle.shellScript).replace(injection, ''));
  const sandbox = { module: { exports: {} }, require: () => ({ withXcodeProject: (config, action) => action(config) }) };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../plugins/with-testflight-api.js'), 'utf8'), sandbox);
  const config = { modResults: project };
  sandbox.module.exports(config);
  assert.ok(JSON.parse(bundle.shellScript).includes(injection));
  const once = bundle.shellScript;
  sandbox.module.exports(config);
  assert.equal(bundle.shellScript, once);
  bundle.shellScript = JSON.stringify('unrecognized bundle command');
  assert.throws(() => sandbox.module.exports(config), /Fase de bundle/);
});
