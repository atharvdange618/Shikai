import { describe, expect, it } from "vitest";

import type { ColorTokens } from "@/constants/theme";
import { getEventDisplay, sortEventsNewestFirst } from "@/lib/github-utils";
import type { GitHubEvent } from "@/types/github.types";

// getEventDisplay reads only three color tokens.
const colors = {
  accent: "#58a6ff",
  success: "#3fb950",
  danger: "#f85149",
} as unknown as ColorTokens;

const event = (o: object) => o as unknown as GitHubEvent;

describe("getEventDisplay", () => {
  it("summarizes a push and rewrites the commit URL to the web form", () => {
    const out = getEventDisplay(
      event({
        type: "PushEvent",
        repo: { name: "facebook/react" },
        payload: {
          size: 3,
          ref: "refs/heads/main",
          commits: [
            {
              url: "https://api.github.com/repos/facebook/react/commits/abc123",
            },
          ],
        },
      }),
      colors,
    );

    expect(out).toMatchObject({
      icon: "repo-push",
      primaryText: "Pushed 3 commits",
      secondaryText: "react → main",
      url: "https://github.com/facebook/react/commit/abc123",
    });
  });

  it("singularizes a one-commit push", () => {
    const out = getEventDisplay(
      event({
        type: "PushEvent",
        repo: { name: "a/b" },
        payload: { size: 1, ref: "refs/heads/dev", commits: [] },
      }),
      colors,
    );
    expect(out?.primaryText).toBe("Pushed 1 commit");
    expect(out?.url).toBe("https://github.com/a/b");
  });

  it("handles a star", () => {
    const out = getEventDisplay(
      event({ type: "WatchEvent", repo: { name: "a/b" }, payload: {} }),
      colors,
    );
    expect(out).toMatchObject({
      icon: "star",
      primaryText: "Starred a repository",
      secondaryText: "b",
    });
  });

  it("marks a closed issue", () => {
    const out = getEventDisplay(
      event({
        type: "IssuesEvent",
        repo: { name: "a/b" },
        payload: { action: "closed", issue: { number: 5, html_url: "u" } },
      }),
      colors,
    );
    expect(out).toMatchObject({
      icon: "issue-closed",
      primaryText: "Closed issue #5",
      url: "u",
    });
  });

  it("returns null for an event type it does not render", () => {
    expect(
      getEventDisplay(
        event({ type: "GollumEvent", repo: { name: "a/b" }, payload: {} }),
        colors,
      ),
    ).toBeNull();
  });
});

describe("sortEventsNewestFirst", () => {
  it("orders events by created_at, newest first", () => {
    const at = (created_at: string) => ({ created_at }) as GitHubEvent;
    const sorted = sortEventsNewestFirst([
      at("2026-10-21T18:25:12Z"),
      at("2026-10-23T11:00:11Z"),
      at("2025-06-23T08:37:30Z"),
      at("2026-10-30T12:38:29Z"),
    ]);
    expect(sorted.map((e) => e.created_at)).toEqual([
      "2026-10-30T12:38:29Z",
      "2026-10-23T11:00:11Z",
      "2026-10-21T18:25:12Z",
      "2025-06-23T08:37:30Z",
    ]);
  });
});
