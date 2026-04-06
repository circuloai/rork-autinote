module.exports = ({ config }) => {
  const finalConfig = { ...config };

  delete finalConfig.runtimeVersion;

  if (finalConfig.updates) {
    delete finalConfig.updates.codeSigningCertificate;
    delete finalConfig.updates.codeSigningMetadata;
  }

  if (finalConfig.extra?.eas) {
    delete finalConfig.extra.eas;
  }

  if (finalConfig.extra) {
    delete finalConfig.extra.updates;
    delete finalConfig.extra.runtimeVersion;
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

  const existingPlugins = finalConfig.plugins || [];
  finalConfig.plugins = [
    ...existingPlugins,
    "./plugins/strip-code-signing",
  ];

  return finalConfig;
};
