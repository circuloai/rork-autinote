const config = require("./app.json");

module.exports = ({ config: expoConfig }) => {
  const merged = { ...config.expo, ...expoConfig };

  // Force updates off and strip all code signing references
  // EAS env vars EXPO_UPDATES_CODE_SIGNING_CERTIFICATE and
  // EXPO_UPDATES_CODE_SIGNING_METADATA can inject invalid paths
  merged.updates = { enabled: false };

  // Clear the env vars so Expo config plugins don't pick them up
  delete process.env.EXPO_UPDATES_CODE_SIGNING_CERTIFICATE;
  delete process.env.EXPO_UPDATES_CODE_SIGNING_METADATA;

  return merged;
};
