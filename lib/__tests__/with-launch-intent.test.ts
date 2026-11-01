import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

// Plain CommonJS config plugin, same shape expo prebuild loads.
const { GUARD, patchMainActivity } = createRequire(import.meta.url)(
  "../../plugins/withLaunchIntent.js",
);

// Trimmed to the parts the patch anchors on, matching Expo's SDK 54 template.
const TEMPLATE = `package com.example.app
import expo.modules.splashscreen.SplashScreenManager

import android.os.Bundle

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY)
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)
  }
}
`;

describe("patchMainActivity", () => {
  it("drops a restored intent before super.onCreate", () => {
    const patched = patchMainActivity(TEMPLATE);

    expect(patched).toContain(GUARD);
    expect(patched).toContain("if (savedInstanceState != null) {");
    expect(patched).toContain("intent = intent?.setData(null)");
    // expo-linking copies intent.data in its onCreate, which runs inside
    // super.onCreate, so the block has to come first.
    expect(patched.indexOf(GUARD)).toBeLessThan(
      patched.indexOf("super.onCreate("),
    );
  });

  it("keeps the indentation of the method body", () => {
    const patched = patchMainActivity(TEMPLATE);
    const lines = patched.split("\n");

    expect(lines).toContain("    " + GUARD);
    expect(lines).toContain("      intent = intent?.setData(null)");
  });

  it("is idempotent, so repeated prebuilds do not stack copies", () => {
    const once = patchMainActivity(TEMPLATE);
    const twice = patchMainActivity(once);

    expect(twice).toBe(once);
    expect(twice.split(GUARD)).toHaveLength(2);
  });

  it("throws when the template no longer has super.onCreate", () => {
    expect(() => patchMainActivity("class MainActivity : ReactActivity() {}")).toThrow(
      /no 'super\.onCreate\('/,
    );
  });
});
