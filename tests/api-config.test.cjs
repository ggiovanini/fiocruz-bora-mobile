const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const code = ts.transpileModule(readFileSync('src/api/config.ts', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
function base(platform, common, android) {
  const exports = {};
  vm.runInNewContext(code, {exports, process: {env: {EXPO_PUBLIC_API_URL: common, EXPO_PUBLIC_ANDROID_API_URL: android}}, require: () => ({Platform: {OS: platform}})});
  return exports.getApiBaseUrl();
}
test('Android can use its own API while iOS and web retain the common URL', () => {
  assert.equal(base('android', 'http://localhost:8000/api/v1', 'http://10.0.2.2:8000/api/v1/'), 'http://10.0.2.2:8000/api/v1');
  for (const platform of ['ios', 'web']) assert.equal(base(platform, 'https://api.example/api/v1/', 'http://10.0.2.2:8000/api/v1'), 'https://api.example/api/v1');
});
test('missing Android override falls back to the common URL and absent configuration stays disabled', () => {
  for (const override of [undefined, '']) assert.equal(base('android', 'https://api.example/api/v1', override), 'https://api.example/api/v1');
  assert.equal(base('android', undefined, undefined), '');
  assert.equal(base('ios', undefined, 'http://10.0.2.2:8000/api/v1'), '');
});
