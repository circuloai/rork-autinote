const baseConfig = require("./app.json");

module.exports = ({ config }) => {
  // Start with base config
  const finalConfig = {
    ...baseConfig.expo,
    ...config
  };

  // Explicitly remove all updates-related fields
  delete finalConfig.updates;
  delete finalConfig.runtimeVersion;
  if (finalConfig.extra?.eas) {
    delete finalConfig.extra.eas;
  }

  // Ensure iOS config is set
  finalConfig.ios = {
    ...finalConfig.ios,
    infoPlist: {
      ...(finalConfig.ios?.infoPlist || {}),
      ITSAppUsesNonExemptEncryption: false
    }
  };

  return finalConfig;
};