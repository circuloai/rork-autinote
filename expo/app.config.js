const config = require("./app.json");

module.exports = ({ config: expoConfig }) => {
  const merged = { ...config.expo, ...expoConfig };

  if (merged.updates) {
    delete merged.updates.codeSigningCertificate;
    delete merged.updates.codeSigningMetadata;
  }

  return merged;
};
