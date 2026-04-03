const baseConfig = require("./app.json");

module.exports = ({ config }) => {
  return {
    ...baseConfig.expo,
    ...config,
    updates: {
      enabled: false,
    },
    runtimeVersion: undefined,
  };
};
