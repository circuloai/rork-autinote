delete process.env.EXPO_UPDATES_CODE_SIGNING_CERTIFICATE;
delete process.env.EXPO_UPDATES_CODE_SIGNING_METADATA;

const config = require("./app.json");

module.exports = ({ config: expoConfig }) => {
  const merged = { ...config.expo, ...expoConfig };

  merged.updates = { enabled: false };

  if (merged.updates) {
    delete merged.updates.codeSigningCertificate;
    delete merged.updates.codeSigningMetadata;
  }

  return merged;
};
