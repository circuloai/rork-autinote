delete process.env.EXPO_UPDATES_CODE_SIGNING_CERTIFICATE;
delete process.env.EXPO_UPDATES_CODE_SIGNING_METADATA;

const { withDangerousMod } = require("expo/config-plugins");

const config = require("./app.json");

function withDisableCodeSigning(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      if (config.updates) {
        delete config.updates.codeSigningCertificate;
        delete config.updates.codeSigningMetadata;
        config.updates.enabled = false;
      }
      delete config.runtimeVersion;
      return config;
    },
  ]);
}

module.exports = ({ config: expoConfig }) => {
  const merged = { ...config.expo, ...expoConfig };

  // Force disable updates and remove any code signing references
  if (merged.updates) {
    delete merged.updates.codeSigningCertificate;
    delete merged.updates.codeSigningMetadata;
    merged.updates.enabled = false;
  } else {
    merged.updates = { enabled: false };
  }

  delete merged.runtimeVersion;

  // Add the config plugin to clean up at the plugin stage
  if (!merged.plugins) {
    merged.plugins = [];
  }
  merged.plugins.push(withDisableCodeSigning);

  return merged;
};
