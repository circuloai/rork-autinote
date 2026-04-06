const { withInfoPlist, withExpoPlist } = require('expo/config-plugins');

function withStripCodeSigning(config) {
  if (config.updates) {
    delete config.updates.codeSigningCertificate;
    delete config.updates.codeSigningMetadata;
  }

  config = withExpoPlist(config, (config) => {
    if (config.modResults) {
      delete config.modResults.EXUpdatesCodeSigningCertificate;
      delete config.modResults.EXUpdatesCodeSigningMetadata;
    }
    return config;
  });

  config = withInfoPlist(config, (config) => {
    if (config.modResults) {
      delete config.modResults.EXUpdatesCodeSigningCertificate;
      delete config.modResults.EXUpdatesCodeSigningMetadata;
    }
    return config;
  });

  return config;
}

module.exports = withStripCodeSigning;
