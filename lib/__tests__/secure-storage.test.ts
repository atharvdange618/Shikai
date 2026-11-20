import { describe, expect, it, vi } from "vitest";

const { getItemAsync, setItemAsync, deleteItemAsync } = vi.hoisted(() => ({
  getItemAsync: vi.fn<() => Promise<string | null>>(),
  setItemAsync: vi.fn<() => Promise<void>>(),
  deleteItemAsync: vi.fn<() => Promise<void>>(),
}));
vi.mock("expo-secure-store", () => ({ getItemAsync, setItemAsync, deleteItemAsync }));

import {
  clearPendingAuth,
  CredentialStorageError,
  deletePAT,
  deleteToken,
  getPendingAuth,
  isValidPAT,
  isValidToken,
  savePAT,
  savePendingAuth,
  saveToken,
} from "@/lib/secure-storage";

describe("credential writes", () => {
  const privateValue = "test-private-value";

  it.each([saveToken, savePAT, savePendingAuth])("reports failed saves safely", async (save) => {
    setItemAsync.mockRejectedValueOnce(new Error(privateValue));
    const result = save(privateValue);
    await expect(result).rejects.toBeInstanceOf(CredentialStorageError);
    await expect(result).rejects.toHaveProperty(
      "message",
      "Could not save credentials on this device. Please try again.",
    );
    await expect(result).rejects.not.toHaveProperty("cause");
  });

  it.each([deleteToken, deletePAT, clearPendingAuth])(
    "reports failed deletes safely",
    async (remove) => {
      deleteItemAsync.mockRejectedValueOnce(new Error(privateValue));
      const result = remove();
      await expect(result).rejects.toBeInstanceOf(CredentialStorageError);
      await expect(result).rejects.toHaveProperty(
        "message",
        "Could not remove credentials from this device. Please try again.",
      );
      await expect(result).rejects.not.toHaveProperty("cause");
    },
  );
});

describe("getPendingAuth", () => {
  it("preserves a valid stored verifier", async () => {
    const pending = { codeVerifier: "test-verifier", timestamp: Date.now() };
    getItemAsync.mockResolvedValueOnce(JSON.stringify(pending));
    await expect(getPendingAuth()).resolves.toEqual(pending);
  });

  it("rejects a stored verifier with an invalid timestamp", async () => {
    getItemAsync.mockResolvedValueOnce(JSON.stringify({ codeVerifier: "test", timestamp: "bad" }));
    await expect(getPendingAuth()).resolves.toBeNull();
  });
});

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
