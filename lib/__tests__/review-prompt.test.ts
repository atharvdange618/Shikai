import { describe, expect, it } from "vitest";

import {
  LAUNCHES_BEFORE_REVIEW,
  recordLaunch,
  type ReviewStorage,
} from "@/lib/review-prompt";

function memoryStorage(): ReviewStorage {
  const values = new Map<string, number | boolean>();
  return {
    getNumber: (key) => {
      const v = values.get(key);
      return typeof v === "number" ? v : undefined;
    },
    getBoolean: (key) => {
      const v = values.get(key);
      return typeof v === "boolean" ? v : undefined;
    },
    set: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("recordLaunch", () => {
  it("asks only on the fifth launch", () => {
    const storage = memoryStorage();
    const results = Array.from({ length: LAUNCHES_BEFORE_REVIEW }, () =>
      recordLaunch(storage),
    );
    expect(results).toEqual([false, false, false, false, true]);
  });

  it("never asks again after asking once", () => {
    const storage = memoryStorage();
    for (let i = 0; i < LAUNCHES_BEFORE_REVIEW; i++) recordLaunch(storage);
    for (let i = 0; i < 20; i++) expect(recordLaunch(storage)).toBe(false);
  });

  it("keeps counting from a stored launch count", () => {
    const storage = memoryStorage();
    storage.set("launches", LAUNCHES_BEFORE_REVIEW - 1);
    expect(recordLaunch(storage)).toBe(true);
  });
});
