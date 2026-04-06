module.exports = ({ config }) => {
  const { updates: _updates, runtimeVersion: _runtimeVersion, ...cleanConfig } = config;

  const finalConfig = {
    ...cleanConfig,
  };

  delete finalConfig.updates;
  delete finalConfig.runtimeVersion;

  if (finalConfig.extra?.eas) {
    delete finalConfig.extra.eas;
  }

  finalConfig.updates = {
    enabled: false,
  };

  finalConfig.ios = {
    ...finalConfig.ios,
    infoPlist: {
      ...(finalConfig.ios?.infoPlist || {}),
      ITSAppUsesNonExemptEncryption: false,
    },
  };

  return finalConfig;
};
