const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Three r186's CommonJS shim calls Node's process.emitWarning, unavailable in
// Hermes. Resolve every root import (including Fiber's require) to the same ESM
// build, preserving one Three instance and Expo's resolver for all other modules.
const threeEsm = path.join(path.dirname(require.resolve('three')), 'three.module.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return { type: 'sourceFile', filePath: threeEsm };
  }
  return context.resolveRequest(context, moduleName, platform);
};
module.exports = config;
