const path = require('node:path');
const { readApiUrl } = require('./testflight-env.cjs');

function configureReleaseEnv(args, env = process.env, root = path.resolve(__dirname, '..')) {
  if (args[0] !== 'export:embed' || args[args.indexOf('--dev') + 1] !== 'false') return;
  const url = readApiUrl(path.join(root, '.env.testflight'));
  env.EXPO_PUBLIC_LOCAL_LOGIN_ENABLED = 'false';
  env.EXPO_PUBLIC_API_URL = url;
  env.EXPO_PUBLIC_ANDROID_API_URL = url;
  // Prevent Expo dotenv files and inherited Metro state from overriding Release.
  env.EXPO_NO_DOTENV = '1';
  delete env.__EXPO_ENV_LOADED;
}

module.exports = { configureReleaseEnv };
if (require.main === module) {
  try {
    configureReleaseEnv(process.argv.slice(2));
    require(require.resolve('@expo/cli', { paths: [require.resolve('expo/package.json')] }));
  } catch (error) {
    console.error(`error: ${error.message}`);
    process.exitCode = 1;
  }
}
