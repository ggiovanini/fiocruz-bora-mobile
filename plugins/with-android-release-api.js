const { withAppBuildGradle } = require('expo/config-plugins');

function configureReleaseApi(source) {
  const cli = /    cliFile = new File\(\["node", "--print", "require.resolve\('@expo\/cli'.*\n/;
  const replacement = '    cliFile = file("$projectRoot/scripts/android-release-cli.cjs")\n';
  if (!source.includes(replacement.trim())) {
    if (!cli.test(source)) throw new Error('Expo CLI configuration changed; review the Android Release API plugin.');
    source = source.replace(cli, replacement);
  }
  if (!source.includes('// BORA_RELEASE_API_INPUTS')) {
    source += `
// BORA_RELEASE_API_INPUTS: rebuild the bundle when its API configuration changes.
tasks.withType(com.facebook.react.tasks.BundleHermesCTask).configureEach {
    inputs.files(file("$projectRoot/.env.testflight"),
        file("$projectRoot/scripts/testflight-env.cjs"))
}
`;
  }
  return source;
}
module.exports = config => withAppBuildGradle(config, config => {
  config.modResults.contents = configureReleaseApi(config.modResults.contents);
  return config;
});
module.exports.configureReleaseApi = configureReleaseApi;
