#!/usr/bin/env node
/**
 * Post-prebuild script - re-applies custom Android build configurations
 * that are wiped by `expo prebuild --clean`.
 *
 * Usage:
 *   node scripts/post-prebuild.js
 *
 * Or run the full pipeline:
 *   npx expo prebuild --clean && node scripts/post-prebuild.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ANDROID_APP = path.join(ROOT, "android", "app");
const GRADLE_PROPS = path.join(ROOT, "android", "gradle.properties");
const BUILD_GRADLE = path.join(ANDROID_APP, "build.gradle");

const log = (msg) => console.log(`[post-prebuild] ${msg}`);
const warn = (msg) => console.warn(`[post-prebuild] WARNING: ${msg}`);

// ─── gradle.properties patches ───
const GRADLE_PROPERTIES_PATCHES = {
  // Architecture filter - match ABI splits config
  "reactNativeArchitectures": {
    expected: "arm64-v8a,x86_64",
    fallback: "arm64-v8a,x86_64",
    description: "Architecture filter for ABI splits",
  },
  // R8 minification
  "android.enableMinifyInReleaseBuilds": {
    expected: "true",
    fallback: "true",
    description: "R8 minification for release builds",
  },
  // Resource shrinking
  "android.enableShrinkResourcesInReleaseBuilds": {
    expected: "true",
    fallback: "true",
    description: "Resource shrinking for release builds",
  },
  // Animated WebP - disabled to save ~3.4MB
  "expo.webp.animated": {
    expected: "false",
    fallback: "false",
    description: "Animated WebP support (disabled to save space)",
  },
};

function patchGradleProperties() {
  log("Patching gradle.properties...");
  let content = fs.readFileSync(GRADLE_PROPS, "utf8");
  let changed = false;

  for (const [key, config] of Object.entries(GRADLE_PROPERTIES_PATCHES)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    const newValue = `${key}=${config.fallback}`;

    if (regex.test(content)) {
      const current = content.match(regex)[0];
      if (current !== newValue) {
        content = content.replace(regex, newValue);
        log(`  Updated ${key} → ${config.fallback} (${config.description})`);
        changed = true;
      } else {
        log(`  ${key} already correct`);
      }
    } else {
      content += `\n${newValue}`;
      log(`  Added ${key}=${config.fallback} (${config.description})`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(GRADLE_PROPS, content, "utf8");
    log("  gradle.properties written");
  } else {
    log("  gradle.properties unchanged");
  }
}

// ─── build.gradle patches ───
const SPLITS_BLOCK = `    splits {
        abi {
            enable true
            reset()
            include "arm64-v8a", "x86_64"
            universalApk true
        }
    }`;

const PACKAGING_EXCLUDE = `        excludes += 'META-INF/versions/9/OSGI-INF/MANIFEST.MF'`;

function patchBuildGradle() {
  log("Patching build.gradle...");
  let content = fs.readFileSync(BUILD_GRADLE, "utf8");
  let changed = false;

  // 1. Add ABI splits block
  if (content.includes("splits {")) {
    log("  splits block already exists");
  } else {
    const splitsInsert = `\n${SPLITS_BLOCK}\n`;
    if (content.includes("androidResources {")) {
      content = content.replace(
        /(androidResources\s*\{[^}]*\}\s*)/,
        `$1${splitsInsert}`,
      );
      log("  Added ABI splits block");
      changed = true;
    } else {
      warn("  Could not find androidResources block - add splits manually");
    }
  }

  // 2. Add META-INF exclusion to packagingOptions
  if (content.includes("META-INF/versions/9/OSGI-INF/MANIFEST.MF")) {
    log("  META-INF exclusion already exists");
  } else {
    if (content.includes("packagingOptions {")) {
      content = content.replace(
        /(packagingOptions\s*\{)/,
        `$1\n${PACKAGING_EXCLUDE}`,
      );
      log("  Added META-INF exclusion");
      changed = true;
    } else {
      warn("  Could not find packagingOptions block - add exclusion manually");
    }
  }

  if (changed) {
    fs.writeFileSync(BUILD_GRADLE, content, "utf8");
    log("  build.gradle written");
  } else {
    log("  build.gradle unchanged");
  }
}

function main() {
  log("Re-applying post-prebuild configurations...\n");

  if (!fs.existsSync(GRADLE_PROPS)) {
    warn(`gradle.properties not found at ${GRADLE_PROPS}`);
    warn("Run 'npx expo prebuild --clean' first");
    process.exit(1);
  }

  if (!fs.existsSync(BUILD_GRADLE)) {
    warn(`build.gradle not found at ${BUILD_GRADLE}`);
    warn("Run 'npx expo prebuild --clean' first");
    process.exit(1);
  }

  patchGradleProperties();
  console.log("");
  patchBuildGradle();

  log("\nDone. Configurations applied:");
  log("  - ABI splits: arm64-v8a, x86_64, universal");
  log("  - R8 minification: enabled");
  log("  - Resource shrinking: enabled");
  log("  - Animated WebP: disabled");
  log("  - META-INF conflict exclusion: added");
}

main();
