const { withGradleProperties } = require("expo/config-plugins");

const PROPS = {
  "android.enableMinifyInReleaseBuilds": "true",
  "android.enableShrinkResourcesInReleaseBuilds": "true",
  reactNativeArchitectures: "arm64-v8a,x86_64",
  "expo.webp.animated": "false",
};

/** @type {import("expo/config-plugins").ConfigPlugin} */
module.exports = function withGradlePropertiesConfig(config) {
  return withGradleProperties(config, (cfg) => {
    for (const [key, value] of Object.entries(PROPS)) {
      const existing = cfg.modResults.find((p) => p.type === "property" && p.key === key);
      if (existing?.type === "property") {
        existing.value = value;
      } else {
        cfg.modResults.push({ type: "property", key, value });
      }
    }
    return cfg;
  });
};
