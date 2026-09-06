import { describe, expect, it } from "vitest";

import {
  compactTimeAgo,
  decodeRepoId,
  encodeRepoId,
  format24HourTime,
  formatBytes,
  formatCount,
  getLanguage,
  isImageFile,
  isVideoFile,
  relativeTime,
} from "@/lib/utils";

describe("formatCount", () => {
  it("leaves values under 1000 alone", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(999)).toBe("999");
  });

  it("uses k for thousands and m for millions", () => {
    expect(formatCount(1500)).toBe("1.5k");
    expect(formatCount(2_000_000)).toBe("2.0m");
  });
});

describe("formatBytes", () => {
  it("shows raw bytes under 1 KB", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("steps up units and drops the decimal at 10 and above", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(10 * 1024)).toBe("10 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(5 * 1024 * 1024 * 1024)).toBe("5.0 GB");
  });
});

describe("timeAgo", () => {
  it("returns a fallback for empty or unparseable input", () => {
    expect(relativeTime("")).toBe("");
    expect(compactTimeAgo("")).toBe("now");
    expect(compactTimeAgo("not a date")).toBe("now");
  });

  it("formats a recent timestamp in each mode", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(relativeTime(fiveMinAgo)).toBe("5m ago");
    expect(compactTimeAgo(fiveMinAgo)).toBe("5m");
  });

  it("says 'just now' under a minute", () => {
    const justNow = new Date(Date.now() - 5 * 1000).toISOString();
    expect(relativeTime(justNow)).toBe("just now");
  });
});

describe("format24HourTime", () => {
  it("shows only the time for today", () => {
    expect(format24HourTime(new Date().toISOString())).toMatch(/^\d{2}:\d{2}$/);
  });

  it("prefixes the month and day for other dates", () => {
    const old = new Date("2020-03-04T09:15:00Z").toISOString();
    expect(format24HourTime(old)).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{2}:\d{2}$/);
  });
});

describe("repo id encoding", () => {
  it("round-trips owner and name", () => {
    expect(encodeRepoId("facebook", "react")).toBe("facebook~~react");
    expect(decodeRepoId("facebook~~react")).toEqual(["facebook", "react"]);
  });

  it("returns an empty name when there is no separator", () => {
    expect(decodeRepoId("lonely")).toEqual(["lonely", ""]);
  });
});

describe("file type checks", () => {
  it("matches image extensions case-insensitively", () => {
    expect(isImageFile("Diagram.PNG")).toBe(true);
    expect(isImageFile("notes.txt")).toBe(false);
  });

  it("matches video extensions", () => {
    expect(isVideoFile("clip.mp4")).toBe(true);
    expect(isVideoFile("clip.gif")).toBe(false);
  });
});

describe("getLanguage", () => {
  it("maps known extensions", () => {
    expect(getLanguage("index.tsx")).toBe("typescript");
    expect(getLanguage("main.py")).toBe("python");
    expect(getLanguage("lib.rs")).toBe("rust");
  });

  it("falls back to text for anything else", () => {
    expect(getLanguage("Makefile")).toBe("text");
    expect(getLanguage("data.parquet")).toBe("text");
  });
});
