const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(projectId, platform = 'ios') {
  const calls = [];
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync('src/telemetry/telemetry.ts', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: false}}).outputText, {
    exports, __DEV__: true,
    require(name) {
      if (name === 'react-native') return {Platform: {OS: platform}};
      if (name === 'expo-constants') return {default: {expoConfig: {extra: {eas: {projectId}}}}};
      assert.equal(name, 'expo-observe');
      calls.push('load');
      return {Observe: {configure: config => calls.push(config.dispatchingEnabled), logEvent: name => calls.push(name)}, ObserveRoot: {wrap: component => ({component})}};
    },
  });
  return {api: exports, calls};
}
test('unconfigured builds never initialize native telemetry or block the root', () => {
  for (const id of [undefined, '', '   ']) {
    const {api, calls} = load(id);
    const root = () => null;
    assert.equal(api.wrapTelemetryRoot(root), root);
    api.setTelemetryConsent(true);
    api.track('local');
    assert.deepEqual(calls, []);
  }
});
test('configured telemetry keeps dispatch disabled until consent and stops after revocation', () => {
  const {api, calls} = load('configured-project');
  api.track('blocked');
  api.setTelemetryConsent(true);
  api.track('allowed');
  api.setTelemetryConsent(false);
  api.track('blocked-again');
  assert.deepEqual(calls, ['load', false, true, 'allowed', false]);
});

test('Android does not load the excluded Observe module even with a project ID', () => {
  const {api, calls} = load('configured-project', 'android');
  api.setTelemetryConsent(true);
  api.track('blocked');
  assert.deepEqual(calls, []);
});
