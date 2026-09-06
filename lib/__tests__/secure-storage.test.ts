import { describe, expect, it, vi } from "vitest";

// The validators are pure; stub the native store so the module imports.
vi.mock("expo-secure-store", () => ({}));

import { isValidPAT, isValidToken } from "@/lib/secure-storage";

describe("isValidToken", () => {
  it("rejects null, too-short and too-long values", () => {
    expect(isValidToken(null)).toBe(false);
    expect(isValidToken("short")).toBe(false);
    expect(isValidToken("a".repeat(501))).toBe(false);
  });

  it("rejects anything with characters outside [word . -]", () => {
    expect(isValidToken("has spaces in it here")).toBe(false);
    expect(isValidToken("tokenwith/slash/inside")).toBe(false);
  });

  it("accepts a normal-looking token", () => {
    expect(isValidToken(`gho_${"a".repeat(36)}`)).toBe(true);
  });
});

describe("isValidPAT", () => {
  it("accepts classic and fine-grained PAT prefixes", () => {
    expect(isValidPAT(`ghp_${"a".repeat(36)}`)).toBe(true);
    expect(isValidPAT(`github_pat_${"a".repeat(22)}`)).toBe(true);
  });

  it("rejects a valid token that is not a PAT", () => {
    expect(isValidPAT(`gho_${"a".repeat(36)}`)).toBe(false);
  });

  it("rejects null and too-short values", () => {
    expect(isValidPAT(null)).toBe(false);
    expect(isValidPAT("ghp_short")).toBe(false);
  });
});
