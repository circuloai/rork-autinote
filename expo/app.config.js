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

  delete finalConfig.codeSigningCertificate;
  delete finalConfig.codeSigningMetadata;

  if (finalConfig.updates) {
    delete finalConfig.updates.codeSigningCertificate;
    delete finalConfig.updates.codeSigningMetadata;
    delete finalConfig.updates.url;
    delete finalConfig.updates.requestHeaders;
    finalConfig.updates = {
      enabled: false,
    };
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
