module.exports = ({ config }) => {
  const finalConfig = JSON.parse(JSON.stringify(config));

  delete finalConfig.runtimeVersion;

  finalConfig.updates = {
    enabled: false,
  };

  if (finalConfig.extra) {
    delete finalConfig.extra.eas;
    delete finalConfig.extra.updates;
    delete finalConfig.extra.runtimeVersion;
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
