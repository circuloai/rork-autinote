delete process.env.EXPO_UPDATES_CODE_SIGNING_CERTIFICATE;
delete process.env.EXPO_UPDATES_CODE_SIGNING_METADATA;

const config = require("./app.json");

module.exports = ({ config: expoConfig }) => {
  const merged = { ...config.expo, ...expoConfig };

  // Force disable updates and remove any code signing references
  merged.updates = { enabled: false };

  // Also clean up runtimeVersion if present (can trigger code signing)
  delete merged.runtimeVersion;

  // Deep clean any updates references from the raw config
  if (expoConfig && expoConfig.updates) {
    delete expoConfig.updates.codeSigningCertificate;
    delete expoConfig.updates.codeSigningMetadata;
  }

  return merged;
};
