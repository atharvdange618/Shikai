const { withAppBuildGradle } = require("expo/config-plugins");

// Per-ABI APKs plus a universal one for local release builds. Disabled for
// bundle tasks (the AAB splits itself) and skipped on EAS, which expects a
// single APK artifact.
const SPLITS_BLOCK = `    splits {
        abi {
            enable !project.gradle.startParameter.taskNames.any { it.toLowerCase().contains('bundle') }
            reset()
            include "arm64-v8a", "x86_64"
            universalApk true
        }
    }`;

module.exports = function withAndroidPackaging(config) {
  return withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;

    const marker = "META-INF/versions/9/OSGI-INF/MANIFEST.MF";
    if (!contents.includes(marker)) {
      contents = contents.replace(
        /packagingOptions\s*\{/,
        `packagingOptions {\n        excludes += '${marker}'`
      );
    }

    if (!process.env.EAS_BUILD && !contents.includes("splits {")) {
      const anchor = /(androidResources\s*\{[^}]*\}\s*)/;
      if (!anchor.test(contents)) {
        throw new Error(
          "withAndroidPackaging: no 'androidResources { ... }' block in build.gradle to anchor the ABI splits. Expo's template changed; update this plugin."
        );
      }
      contents = contents.replace(anchor, `$1\n${SPLITS_BLOCK}\n`);
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
};
