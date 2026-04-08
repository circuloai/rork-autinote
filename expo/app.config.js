module.exports = ({ config }) => {
  const {
    runtimeVersion: _runtimeVersion,
    updates: _updates,
    codeSigningCertificate: _codeSigningCertificate,
    codeSigningMetadata: _codeSigningMetadata,
    ...cleanConfig
  } = JSON.parse(JSON.stringify(config));

  delete cleanConfig.runtimeVersion;
  delete cleanConfig.codeSigningCertificate;
  delete cleanConfig.codeSigningMetadata;

  if (cleanConfig.extra) {
    delete cleanConfig.extra.eas;
    delete cleanConfig.extra.updates;
    delete cleanConfig.extra.runtimeVersion;
    if (Object.keys(cleanConfig.extra).length === 0) {
      delete cleanConfig.extra;
    }
  }

  cleanConfig.updates = {
    enabled: false,
  };

  cleanConfig.ios = {
    ...cleanConfig.ios,
    infoPlist: {
      ...(cleanConfig.ios?.infoPlist || {}),
      ITSAppUsesNonExemptEncryption: false,
    },
  };

  return cleanConfig;
};
