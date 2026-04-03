// Aggressively remove any code signing env vars before anything else
delete process.env.EXPO_UPDATES_CODE_SIGNING_CERTIFICATE;
delete process.env.EXPO_UPDATES_CODE_SIGNING_METADATA;
delete process.env.CODE_SIGNING_CERTIFICATE;

const { withInfoPlist } = require("expo/config-plugins");

const baseConfig = require("./app.json");

function withCleanUpdates(config) {
  return withInfoPlist(config, (mod) => {
    if (mod.modResults) {
      delete mod.modResults.EXUpdatesCodeSigningCertificate;
      delete mod.modResults.EXUpdatesCodeSigningMetadata;
      mod.modResults.EXUpdatesEnabled = false;
    }
    return mod;
  });
}

module.exports = ({ config: expoConfig }) => {
  const merged = { ...baseConfig.expo, ...expoConfig };

  // Completely remove updates-related fields
  merged.updates = { enabled: false };
  delete merged.runtimeVersion;

  // Ensure plugins array exists
  if (!merged.plugins) {
    merged.plugins = [];
  }

  // Add our cleanup plugin
  merged.plugins.push(withCleanUpdates);

  return merged;
};
