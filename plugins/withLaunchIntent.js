const { withMainActivity } = require("expo/config-plugins");

// Marks the injected block so a second prebuild updates in place instead of
// stacking copies. Prebuild runs this plugin on every build, including EAS.
const GUARD = "// @shikai-restored-launch-intent";

// Android hands a task that is brought back from the dead the intent that
// created it, link and all, and both RN and expo-linking read that intent for
// `getInitialURL()`. Clearing the data on a restore is what makes a restored
// task (which already showed the link) distinguishable from someone tapping it
// again. Runs before `super.onCreate`, because expo-linking's lifecycle
// listener copies `intent.data` into its initial URL there.
//
// `savedInstanceState != null` covers the launcher bringing back a killed task
// and the system recreating the activity in general. A fresh tap into a dead
// task arrives through `onNewIntent` instead, so it is not dropped here.
const BLOCK = [
  GUARD,
  "// Android restores the task's original intent, link and all. Drop it, or",
  "// Linking.getInitialURL() reopens that link on every start. See D-033.",
  "if (savedInstanceState != null) {",
  "  intent = intent?.setData(null)",
  "}",
];

/**
 * Injects the block above before `super.onCreate(`. Pure, for tests.
 * @param {string} contents
 */
function patchMainActivity(contents) {
  if (contents.includes(GUARD)) return contents;

  const anchor = /^([ \t]*)super\.onCreate\(/m;
  const found = contents.match(anchor);
  if (!found) {
    throw new Error(
      "withLaunchIntent: no 'super.onCreate(' in MainActivity to anchor the restored-intent block. Expo's template changed; update this plugin.",
    );
  }

  const indent = found[1];
  const block = BLOCK.map((line) => `${indent}${line}`).join("\n");
  return contents.replace(anchor, `${block}\n${indent}super.onCreate(`);
}

/** @type {import("expo/config-plugins").ConfigPlugin} */
const withLaunchIntent = (config) =>
  withMainActivity(config, (cfg) => {
    if (cfg.modResults.language !== "kt") {
      throw new Error(
        `withLaunchIntent: MainActivity is ${cfg.modResults.language}, not Kotlin. This patch is Kotlin-only; update this plugin.`,
      );
    }
    cfg.modResults.contents = patchMainActivity(cfg.modResults.contents);
    return cfg;
  });

module.exports = Object.assign(withLaunchIntent, { patchMainActivity, GUARD });
