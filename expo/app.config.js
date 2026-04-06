const baseConfig = require("./app.json");

module.exports = ({ config }) => {
  const configWithoutUpdates = { ...baseConfig.expo };
  
  // Remove updates-related fields that might have been added by eas init
  delete configWithoutUpdates.updates;
  delete configWithoutUpdates.runtimeVersion;
  delete configWithoutUpdates.extra?.eas;
  
  return {
    ...configWithoutUpdates,
    ...config
  };
};