const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
// Load just the project resolver with a minimal Expo config: do not boot Metro.
const mod = { exports: {} };
vm.runInNewContext(fs.readFileSync('metro.config.js', 'utf8'), {
  __dirname: path.resolve('.'), module: mod,
  require: Object.assign(name => name === 'expo/metro-config' ? { getDefaultConfig: () => ({ resolver: {} }) } : require(name), { resolve: require.resolve }),
});
test('all platforms resolve Fiber and app Three imports to the ESM entry, not the Node-only CJS shim', () => {
  for (const platform of ['ios', 'android', 'web']) {
    const result = mod.exports.resolver.resolveRequest({resolveRequest(){throw new Error('Three must not fall back to the CJS entry');}}, 'three', platform);
    assert.equal(result.type, 'sourceFile');
    assert.equal(path.basename(result.filePath), 'three.module.js');
    assert.ok(fs.existsSync(result.filePath));
    assert.ok(!fs.readFileSync(result.filePath, 'utf8').includes('process.emitWarning'));
  }
});
test('other packages retain Expo resolver behavior and platform', () => {
  const expected = { type: 'sourceFile', filePath: '/example/ios.tsx' };
  const context = {resolveRequest(ctx, name, platform) { assert.equal(ctx, context); assert.equal(name, 'expo-gl'); assert.equal(platform, 'ios'); return expected; }};
  assert.equal(mod.exports.resolver.resolveRequest(context, 'expo-gl', 'ios'), expected);
});
