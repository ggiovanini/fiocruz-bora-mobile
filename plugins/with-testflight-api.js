const { withXcodeProject } = require('expo/config-plugins');

module.exports = function withTestflightApi(config) {
  return withXcodeProject(config, config => {
    const phases = config.modResults.pbxShellScriptBuildPhaseSection();
    for (const phase of Object.values(phases)) {
      if (!phase || typeof phase !== 'object' || !phase.name?.includes('Bundle React Native')) continue;
      const script = JSON.parse(phase.shellScript);
      if (script.includes('BORA_ARCHIVE_ENV')) continue;
      const position = script.lastIndexOf('\n`');
      if (position < 0) throw new Error('Fase de bundle do iOS não reconhecida para configurar a API de Release.');
      phase.shellScript = JSON.stringify(script.slice(0, position) + '\n# BORA_ARCHIVE_ENV\nsource "$PROJECT_ROOT/scripts/xcode-api-env.sh"\n' + script.slice(position));
    }
    return config;
  });
};
