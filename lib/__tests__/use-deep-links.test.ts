import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  push: vi.fn(),
  openURL: vi.fn(),
  resetShareIntent: vi.fn(),
  share: {
    hasShareIntent: false,
    shareIntent: {} as { webUrl?: string | null; text?: string | null },
  },
}));

// Effects run inline on each call, so calling the hook again is a re-render.
vi.mock("react", () => ({
  useEffect: (effect: () => void) => effect(),
  useRef: <T>(current: T) => ({ current }),
}));
vi.mock("expo-router", () => ({ useRouter: () => ({ push: m.push }) }));
vi.mock("expo-linking", () => ({
  getInitialURL: () => Promise.resolve(null),
  addEventListener: () => ({ remove: vi.fn() }),
  openURL: (url: string) => {
    m.openURL(url);
    return Promise.resolve();
  },
}));
vi.mock("expo-share-intent", () => ({
  useShareIntentContext: () => ({
    ...m.share,
    resetShareIntent: m.resetShareIntent,
  }),
}));

import { useDeepLinks } from "@/hooks/useDeepLinks";
import { parseGitHubUrl } from "@/lib/github-url";

describe("useDeepLinks share intents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.share.hasShareIntent = true;
    m.share.shareIntent = {
      text: "Look at this https://github.com/facebook/react/pull/1",
    };
  });

  it("keeps a share that arrives before sign-in, then routes it", () => {
    useDeepLinks(false);
    expect(m.resetShareIntent).not.toHaveBeenCalled();
    expect(m.push).not.toHaveBeenCalled();

    useDeepLinks(true);
    expect(m.push).toHaveBeenCalledWith(
      parseGitHubUrl("https://github.com/facebook/react/pull/1"),
    );
    expect(m.resetShareIntent).toHaveBeenCalledOnce();
  });

  it("ignores a shared link that isn't on github.com", () => {
    m.share.shareIntent = { webUrl: "https://api.github.com/repos/a/b" };
    useDeepLinks(true);
    expect(m.push).not.toHaveBeenCalled();
    expect(m.openURL).not.toHaveBeenCalled();
    expect(m.resetShareIntent).toHaveBeenCalledOnce();
  });
});
