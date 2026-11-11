const {test} = require('node:test');
const assert = require('node:assert/strict');
const {configureDevSupport} = require('../plugins/with-android-dev-support');

test('Android uses the app build variant for Metro and preserves it across prebuilds', () => {
  const source = 'ExpoReactHostFactory.getDefaultReactHost(\n      context = applicationContext,\n    )';
  const result = configureDevSupport(source);
  assert.match(result, /useDevSupport = BuildConfig.DEBUG,/);
  assert.equal(configureDevSupport(result), result);
  assert.throws(() => configureDevSupport('new template'), /Expo React host changed/);
});
