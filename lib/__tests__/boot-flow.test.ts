import { describe, expect, it } from "vitest";

import { bootReducer, initialBootState, type BootState } from "@/lib/boot-flow";

describe("bootReducer", () => {
  it("starts in checkingSecurity", () => {
    expect(initialBootState).toEqual({ phase: "checkingSecurity" });
  });

  it("moves from checkingSecurity to restoringAuth on SECURITY_PASSED", () => {
    const next = bootReducer(initialBootState, { type: "SECURITY_PASSED" });
    expect(next).toEqual({ phase: "restoringAuth" });
  });

  it("moves from checkingSecurity to blocked on SECURITY_BLOCKED", () => {
    const next = bootReducer(initialBootState, {
      type: "SECURITY_BLOCKED",
      reasons: ["rooted"],
      devModeBlocked: false,
    });
    expect(next).toEqual({
      phase: "blocked",
      reasons: ["rooted"],
      devModeBlocked: false,
    });
  });

  it("moves from restoringAuth to ready on AUTH_RESTORE_COMPLETE", () => {
    const restoring: BootState = { phase: "restoringAuth" };
    const next = bootReducer(restoring, { type: "AUTH_RESTORE_COMPLETE" });
    expect(next).toEqual({ phase: "ready", lastRoutedToken: undefined });
  });

  it("moves from blocked back to restoringAuth when a recheck passes", () => {
    const blocked: BootState = {
      phase: "blocked",
      reasons: ["debugger attached"],
      devModeBlocked: false,
    };
    const next = bootReducer(blocked, { type: "SECURITY_PASSED" });
    expect(next).toEqual({ phase: "restoringAuth" });
  });

  it("ignores a duplicate SECURITY_PASSED once past checkingSecurity", () => {
    const restoring: BootState = { phase: "restoringAuth" };
    const next = bootReducer(restoring, { type: "SECURITY_PASSED" });
    expect(next).toBe(restoring);
  });

  it("ignores TOKEN_CHANGED before reaching ready", () => {
    const restoring: BootState = { phase: "restoringAuth" };
    const next = bootReducer(restoring, {
      type: "TOKEN_CHANGED",
      token: "abc123",
    });
    expect(next).toBe(restoring);
  });

  it("routes once on the first TOKEN_CHANGED after ready, even when signed out", () => {
    const ready: BootState = { phase: "ready", lastRoutedToken: undefined };
    const next = bootReducer(ready, { type: "TOKEN_CHANGED", token: null });
    expect(next).toEqual({ phase: "ready", lastRoutedToken: null });
  });

  it("routes once on the first TOKEN_CHANGED after ready, when signed in", () => {
    const ready: BootState = { phase: "ready", lastRoutedToken: undefined };
    const next = bootReducer(ready, {
      type: "TOKEN_CHANGED",
      token: "abc123",
    });
    expect(next).toEqual({ phase: "ready", lastRoutedToken: "abc123" });
  });

  it("dedupes a repeated TOKEN_CHANGED with the same token", () => {
    const ready: BootState = { phase: "ready", lastRoutedToken: "abc123" };
    const next = bootReducer(ready, {
      type: "TOKEN_CHANGED",
      token: "abc123",
    });
    expect(next).toBe(ready);
  });

  it("routes again when the token changes from signed-in to signed-out", () => {
    const ready: BootState = { phase: "ready", lastRoutedToken: "abc123" };
    const next = bootReducer(ready, { type: "TOKEN_CHANGED", token: null });
    expect(next).toEqual({ phase: "ready", lastRoutedToken: null });
  });

  it("stays inert against rapid TOKEN_CHANGED actions arriving before AUTH_RESTORE_COMPLETE", () => {
    let state: BootState = { phase: "restoringAuth" };
    state = bootReducer(state, { type: "TOKEN_CHANGED", token: "abc123" });
    state = bootReducer(state, { type: "TOKEN_CHANGED", token: null });
    state = bootReducer(state, { type: "TOKEN_CHANGED", token: "def456" });
    expect(state).toEqual({ phase: "restoringAuth" });

    state = bootReducer(state, { type: "AUTH_RESTORE_COMPLETE" });
    expect(state).toEqual({ phase: "ready", lastRoutedToken: undefined });
  });
});
