#!/usr/bin/env node
/**
 * Post-prebuild script - re-applies custom Android build configurations
 * that are wiped by `expo prebuild --clean`.
 *
 * R8, shrinkResources, architecture, and webp patches are handled by
 * config plugins (withGradleProperties.js). This script handles:
 * - Keystore restore from keystore/ to android/app/
 * - Release signing config in build.gradle
 * - ABI splits in build.gradle
 * - META-INF exclusion in build.gradle
 * - KEYSTORE_PASSWORD in gradle.properties
 *
 * Usage:
 *   node scripts/post-prebuild.js
 *
 * Or run the full pipeline:
 *   npx expo prebuild --clean && node scripts/post-prebuild.js
 */

const fs = require("fs");
const path = require("path");

const cwd = process.cwd();
const ROOT = cwd.endsWith("scripts") ? path.resolve(cwd, "..") : cwd;
const ANDROID_APP = path.join(ROOT, "android", "app");
const GRADLE_PROPS = path.join(ROOT, "android", "gradle.properties");
const BUILD_GRADLE = path.join(ANDROID_APP, "build.gradle");
const KEYSTORE_SRC = path.join(ROOT, "keystore", "release.keystore");
const KEYSTORE_DEST = path.join(ANDROID_APP, "release.keystore");

const log = (msg) => console.log(`[post-prebuild] ${msg}`);
const warn = (msg) => console.warn(`[post-prebuild] WARNING: ${msg}`);

// ─── keystore restore ───
function restoreKeystore() {
  log("Restoring release keystore...");

  if (!fs.existsSync(KEYSTORE_SRC)) {
    warn(`Release keystore not found at ${KEYSTORE_SRC}`);
    warn("Release builds will use debug signing. This is NOT suitable for Play Store.");
    return false;
  }

  if (fs.existsSync(KEYSTORE_DEST)) {
    log("  release.keystore already exists in android/app/");
    return true;
  }

  fs.copyFileSync(KEYSTORE_SRC, KEYSTORE_DEST);
  log("  Copied release.keystore from keystore/ directory");
  return true;
}

// ─── gradle.properties patches ───
// R8, shrinkResources, architecture, and webp are now handled by
// plugins/withGradleProperties.js (runs during expo prebuild for both
// local and EAS builds). Only the keystore password stays here since
// it's too sensitive to commit in a config plugin.
const GRADLE_PROPERTIES_PATCHES = {
  KEYSTORE_PASSWORD: {
    expected: "***REDACTED-ROTATED-PASSWORD***",
    fallback: "***REDACTED-ROTATED-PASSWORD***",
    description: "Release keystore password",
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
            // Disabled automatically for bundleRelease (AAB builds)
            enable !project.gradle.startParameter.taskNames.any { it.toLowerCase().contains('bundle') }
            reset()
            include "arm64-v8a", "x86_64"
            universalApk true
        }
    }`;

const PACKAGING_EXCLUDE = `        excludes += 'META-INF/versions/9/OSGI-INF/MANIFEST.MF'`;

const RELEASE_SIGNING_CONFIG = `        release {
            storeFile file('release.keystore')
            storePassword KEYSTORE_PASSWORD
            keyAlias 'shikai'
            keyPassword KEYSTORE_PASSWORD
        }`;

function patchBuildGradle() {
  log("Patching build.gradle...");
  let content = fs.readFileSync(BUILD_GRADLE, "utf8");
  let changed = false;

  // 1. Add release signing config
  if (content.includes("release {") && content.includes("storeFile file('release.keystore')")) {
    log("  Release signing config already exists");
  } else if (fs.existsSync(KEYSTORE_DEST)) {
    if (content.includes("signingConfigs {")) {
      // Add release config after debug config
      content = content.replace(
        /(signingConfigs\s*\{\s*debug\s*\{[^}]+\}\s*)/,
        `$1\n${RELEASE_SIGNING_CONFIG}\n`,
      );
      log("  Added release signing config");
      changed = true;
    }
  } else {
    warn("  Release keystore not found - skipping signing config");
  }

  // 2. Update release build type to use release signing config
  if (content.includes("release {") && content.includes("signingConfig signingConfigs.debug")) {
    content = content.replace(
      /(release\s*\{[^}]*signingConfig\s+)signingConfigs\.debug/,
      `$1signingConfigs.release`,
    );
    log("  Updated release build type to use release signing config");
    changed = true;
  } else if (content.includes("signingConfig signingConfigs.release")) {
    log("  Release build type already uses release signing config");
  }

  // 3. Add ABI splits block
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

  // 4. Add META-INF exclusion to packagingOptions
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

  restoreKeystore();
  console.log("");
  patchGradleProperties();
  console.log("");
  patchBuildGradle();

  log("\nDone. Configurations applied:");
  log("  - Release keystore restored");
  log("  - Release signing config added");
  log("  - Release keystore password set");
  log("  - ABI splits: arm64-v8a, x86_64, universal");
  log("  - META-INF conflict exclusion: added");
  log("  (R8, shrinkResources, architecture, webp handled by withGradleProperties plugin)");
}

main();
