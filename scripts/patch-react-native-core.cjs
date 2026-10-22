// React Native 0.86 assumes that a framework without a configuration marker is
// Debug. CocoaPods can leave a Release framework without that marker after an
// install. Select the requested artifact instead of trusting the missing state.
const fs = require('node:fs');
const path = require('node:path');
const original = `  // Assumption: if there is no stored last build, we assume that it was build for debug.
  if (!fileExists && configuration === 'Debug') {
    console.log(
      'No previous build detected, but Debug Configuration. No need to replace React-Core-prebuilt',
    );
    return false;
  }`;
const replacement = `  // BORA: no marker means unknown configuration; extract the requested artifact.
  if (!fileExists) {
    console.log('No configuration marker. Restoring the requested React-Core-prebuilt artifact.');
    return true;
  }`;
function patch(source) {
  if (source.includes(replacement)) return source;
  if (!source.includes(original)) throw new Error('React Native core selection script changed. Review/remove the missing-marker workaround before building iOS.');
  return source.replace(original, replacement);
}
if (require.main === module) {
  const script = path.join(path.dirname(require.resolve('react-native/package.json')), 'scripts/replace-rncore-version.js');
  const source = fs.readFileSync(script, 'utf8');
  const result = patch(source);
  if (result !== source) fs.writeFileSync(script, result);
  console.log('React Native Core: missing configuration marker workaround ready.');
}
module.exports = {patch};
