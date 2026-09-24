const fs = require("fs");
const path = require("path");
const { withAppBuildGradle } = require("expo/config-plugins");

// Signs local release builds with keystore/release.keystore (gitignored).
// Gradle reads the password from SHIKAI_KEYSTORE_PASSWORD at build time, so
// it never lands on disk; a release build without it fails at signing
// validation. Skipped on EAS, which signs with its own stored credentials,
// and when the keystore is absent (fresh clones, debug-only setups).
const RELEASE_SIGNING_CONFIG = `        release {
            storeFile rootProject.file('../keystore/release.keystore')
            storePassword System.getenv('SHIKAI_KEYSTORE_PASSWORD')
            keyAlias 'shikai'
            keyPassword System.getenv('SHIKAI_KEYSTORE_PASSWORD')
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    const keystore = path.join(cfg.modRequest.projectRoot, "keystore", "release.keystore");
    if (process.env.EAS_BUILD || !fs.existsSync(keystore)) return cfg;

    let contents = cfg.modResults.contents;
    if (contents.includes("signingConfig signingConfigs.release")) return cfg;

    const buildType = /(release\s*\{[^}]*signingConfig\s+)signingConfigs\.debug/;
    const debugConfig = /(signingConfigs\s*\{\s*debug\s*\{[^}]+\}\s*)/;
    if (!buildType.test(contents) || !debugConfig.test(contents)) {
      throw new Error(
        "withReleaseSigning: couldn't find the debug signingConfig or the release build type in build.gradle. Expo's template changed; update this plugin."
      );
    }

    // Build type first: once the release signing block exists, a lazy
    // `release {` match could land inside signingConfigs instead.
    contents = contents.replace(buildType, "$1signingConfigs.release");
    contents = contents.replace(debugConfig, `$1\n${RELEASE_SIGNING_CONFIG}\n`);

    cfg.modResults.contents = contents;
    return cfg;
  });
};
