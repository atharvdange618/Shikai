import { describe, expect, it } from "vitest";

import {
  compactTimeAgo,
  decodeRepoId,
  encodeRepoId,
  format24HourTime,
  formatBytes,
  formatCount,
  formatDuration,
  getFileKind,
  getLanguage,
  isImageFile,
  isSvgFile,
  isVideoFile,
  parseTargetLine,
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

  it("matches svg case-insensitively and nothing else", () => {
    expect(isSvgFile("Logo.SVG")).toBe(true);
    expect(isSvgFile("logo.png")).toBe(false);
    expect(isSvgFile("svg")).toBe(false);
  });

  it("matches video extensions", () => {
    expect(isVideoFile("clip.mp4")).toBe(true);
    expect(isVideoFile("clip.gif")).toBe(false);
  });
});

describe("getFileKind", () => {
  it("routes media to their viewers", () => {
    expect(getFileKind("logo.png")).toBe("image");
    expect(getFileKind("icon.svg")).toBe("image");
    expect(getFileKind("demo.mp4")).toBe("video");
    expect(getFileKind("paper.pdf")).toBe("pdf");
  });

  it("treats every markdown extension as markdown", () => {
    expect(getFileKind("README.md")).toBe("markdown");
    expect(getFileKind("page.mdx")).toBe("markdown");
    expect(getFileKind("notes.markdown")).toBe("markdown");
  });

  it("keeps binaries out of the code viewer", () => {
    expect(getFileKind("gradle-wrapper.jar")).toBe("binary");
    expect(getFileKind("Inter.WOFF2")).toBe("binary");
    expect(getFileKind("libapp.so")).toBe("binary");
  });

  it("ignores case", () => {
    expect(getFileKind("SCAN.PDF")).toBe("pdf");
    expect(getFileKind("CHANGELOG.MD")).toBe("markdown");
  });

  it("falls back to text for code, dotfiles and missing names", () => {
    expect(getFileKind("index.tsx")).toBe("text");
    expect(getFileKind(".gitignore")).toBe("text");
    expect(getFileKind("Makefile")).toBe("text");
    expect(getFileKind("")).toBe("text");
  });

  it("only looks at the last extension", () => {
    expect(getFileKind("pdf.ts")).toBe("text");
    expect(getFileKind("backup.md.txt")).toBe("text");
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

describe("formatDuration", () => {
  const start = "2026-01-01T00:00:00Z";

  it("formats seconds, minutes and hours", () => {
    expect(formatDuration(start, "2026-01-01T00:00:45Z")).toBe("45s");
    expect(formatDuration(start, "2026-01-01T00:03:12Z")).toBe("3m 12s");
    expect(formatDuration(start, "2026-01-01T01:05:30Z")).toBe("1h 5m");
  });

  it("never goes negative on clock skew", () => {
    expect(formatDuration(start, "2025-12-31T23:59:50Z")).toBe("0s");
  });
});

describe("parseTargetLine", () => {
  it("reads a positive line number", () => {
    expect(parseTargetLine("42")).toBe(42);
  });

  it("drops missing, zero, negative and non-numeric values", () => {
    expect(parseTargetLine(undefined)).toBeUndefined();
    expect(parseTargetLine("")).toBeUndefined();
    expect(parseTargetLine("0")).toBeUndefined();
    expect(parseTargetLine("-3")).toBeUndefined();
    expect(parseTargetLine("2x")).toBeUndefined();
    expect(parseTargetLine("1.5")).toBeUndefined();
  });
});
