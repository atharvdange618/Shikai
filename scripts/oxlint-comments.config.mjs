import { relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const baseline = {
  "lib/__tests__/markdown-html.test.ts": [
    "// eslint-disable-next-line typescript/no-implied-eval -- runs the page's own script line",
    "// eslint-disable-next-line typescript/no-implied-eval -- compiles and runs the page's own script text",
  ],
  "lib/highlight.ts": [
    "// ponytail: files past either cap render as plaintext. Highlighting runs on",
    "// the JS thread at roughly 60ms per 1000 lines in dev Hermes, so a huge file",
    "// would freeze taps. The character cap catches minified files, which are one",
    "// long line. Plaintext stays cheap: 62ms for a 1 MB, 28k-line file in Node,",
    "// and GitHub sends no content past 1 MB. If big files matter, run",
    "// highlight() inside the WebView, where V8 does the same work about 10x",
    "// faster.",
  ],
  "lib/mmkv.ts": [
    "// Clears every MMKV-backed store, not just the React Query cache instance.",
    "// Must stay exhaustive: watchlist/recent-searches are account-specific data",
    "// that would otherwise leak into the next account signed in on this device.",
    "// The theme is a device setting, not account data, so it survives the wipe.",
  ],
  "lib/run-display.ts": [
    "// oxlint-disable-next-line eslint/no-control-regex -- ANSI color codes start with ESC.",
  ],
  "plugins/withLaunchIntent.js": [
    "// Marks the injected block so a second prebuild updates in place instead of",
    "// stacking copies. Prebuild runs this plugin on every build, including EAS.",
    "// Android hands a task that is brought back from the dead the intent that",
    "// created it, link and all, and both RN and expo-linking read that intent for",
    "// `getInitialURL()`. Clearing the data on a restore is what makes a restored",
    "// task (which already showed the link) distinguishable from someone tapping it",
    "// again. Runs before `super.onCreate`, because expo-linking's lifecycle",
    "// listener copies `intent.data` into its initial URL there.",
    "//",
    "// `savedInstanceState != null` covers the launcher bringing back a killed task",
    "// and the system recreating the activity in general. A fresh tap into a dead",
    "// task arrives through `onNewIntent` instead, so it is not dropped here.",
  ],
  "plugins/withReleaseSigning.js": [
    "// Signs local release builds with keystore/release.keystore (gitignored).",
    "// Gradle reads the password from SHIKAI_KEYSTORE_PASSWORD at build time, so",
    "// it never lands on disk; a release build without it fails at signing",
    "// validation. Skipped on EAS, which signs with its own stored credentials,",
    "// and when the keystore is absent (fresh clones, debug-only setups).",
  ],
};

export default {
  meta: { name: "shikai" },
  rules: {
    "jsdoc-only": {
      create(context) {
        return {
          Program(node) {
            const file = relative(root, context.filename).replaceAll("\\", "/");
            const remaining = [...(Object.hasOwn(baseline, file) ? baseline[file] : [])];
            for (const comment of context.sourceCode.getAllComments()) {
              const raw = context.sourceCode.getText(comment);
              if (comment.type === "Block" && /^\/\*\*(?![*/])/.test(raw)) continue;
              const existing = remaining.indexOf(raw);
              if (existing !== -1) {
                remaining.splice(existing, 1);
                continue;
              }
              context.report({
                loc: comment.loc,
                message: "Only JSDoc comments are allowed. Record decisions in notes/DECISIONS.md.",
              });
            }
            if (remaining.length) {
              context.report({ node, message: "Remove unused entries from the comment baseline." });
            }
          },
        };
      },
    },
  },
};
