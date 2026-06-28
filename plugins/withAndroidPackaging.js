const { withAppBuildGradle } = require("expo/config-plugins");

module.exports = function withAndroidPackaging(config) {
  return withAppBuildGradle(config, (cfg) => {
    const marker = "META-INF/versions/9/OSGI-INF/MANIFEST.MF";
    if (cfg.modResults.contents.includes(marker)) return cfg;

    cfg.modResults.contents = cfg.modResults.contents.replace(
      /packagingOptions\s*\{/,
      `packagingOptions {\n        excludes += '${marker}'`
    );
    return cfg;
  });
};
