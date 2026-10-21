// ExpoModulesJSI 57.1.0 strips private C++ extensions from its public Swift
// interface. Swift 6.4 emits __ObjC:: where older Swift emitted __ObjC.
// Keep the upstream sanitization working for both spellings until fixed upstream.
const fs = require('node:fs');
const path = require('node:path');
const script = path.join(path.dirname(require.resolve('expo-modules-jsi/package.json')), 'apple/scripts/build-xcframework.sh');
const original = "sed '/^extension __ObjC\\./,/^}/d;";
const patched = "sed '/^extension __ObjC[.:]/,/^}/d;";
const source = fs.readFileSync(script, 'utf8');
if (source.includes(original)) {
  fs.writeFileSync(script, source.replace(original, patched));
  console.log('ExpoModulesJSI: Swift 6.4 interface compatibility patch applied.');
} else if (source.includes(patched)) {
  console.log('ExpoModulesJSI: Swift 6.4 interface compatibility patch already applied.');
} else {
  throw new Error('ExpoModulesJSI build script changed. Review/remove the Swift 6.4 compatibility patch before building iOS.');
}
