const { withMainApplication } = require('expo/config-plugins');

// ExpoReactHostFactory defaults to the React Native library's build flag.
// Use this application's variant so Debug loads Metro and Release loads assets.
function configureDevSupport(source) {
  if (source.includes('useDevSupport = BuildConfig.DEBUG,')) return source;
  const anchor = 'ExpoReactHostFactory.getDefaultReactHost(\n';
  if (!source.includes(anchor)) throw new Error('Expo React host changed; review the Android development support plugin.');
  return source.replace(anchor, `${anchor}      useDevSupport = BuildConfig.DEBUG,\n`);
}
module.exports = function withAndroidDevSupport(config) {
  return withMainApplication(config, config => {
    if (config.modResults.language !== 'kt') throw new Error('Android development support plugin requires Kotlin.');
    config.modResults.contents = configureDevSupport(config.modResults.contents);
    return config;
  });
};
module.exports.configureDevSupport = configureDevSupport;
