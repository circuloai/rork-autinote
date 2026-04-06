module.exports = ({ config }) => {
  const { updates: _updates, runtimeVersion: _runtimeVersion, ...cleanConfig } = config;

  const finalConfig = {
    ...cleanConfig,
  };

  if (finalConfig.extra?.eas) {
    delete finalConfig.extra.eas;
  }

  finalConfig.ios = {
    ...finalConfig.ios,
    infoPlist: {
      ...(finalConfig.ios?.infoPlist || {}),
      ITSAppUsesNonExemptEncryption: false,
    },
  };

  return finalConfig;
};
