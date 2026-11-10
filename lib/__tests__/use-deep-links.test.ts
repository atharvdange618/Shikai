import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  push: vi.fn(),
  openURL: vi.fn(),
  resetShareIntent: vi.fn(),
  initialUrl: null as string | null,
  getInitialURL: vi.fn<() => Promise<string | null>>(),
  storage: new Map<string, string>(),
  share: {
    hasShareIntent: false,
    shareIntent: {},
  },
}));

// Effects run inline on each call, and every call gets fresh refs, so calling
// the hook again is a re-render. For the cold-start tests it also stands in for
// the next JS start, where the refs are new but MMKV is not.
vi.mock("react", () => ({
  useEffect: (effect: () => void) => effect(),
  useRef: <T>(current: T) => ({ current }),
}));
vi.mock("expo-router", () => ({ useRouter: () => ({ push: m.push }) }));
vi.mock("expo-linking", () => ({
  getInitialURL: m.getInitialURL,
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
vi.mock("@/lib/mmkv", () => ({
  mmkv: {
    getString: (key: string) => m.storage.get(key),
    set: (key: string, value: string) => {
      m.storage.set(key, value);
    },
    remove: (key: string) => {
      m.storage.delete(key);
    },
  },
}));

import { useDeepLinks } from "@/hooks/useDeepLinks";
import { parseGitHubUrl } from "@/lib/github-url";

describe("useDeepLinks cold-start links", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.getInitialURL.mockImplementation(() => Promise.resolve(m.initialUrl));
    m.storage.clear();
    m.share.hasShareIntent = false;
  });

  it("opens a cold-start shikai:// link once routing is enabled", async () => {
    m.initialUrl = "shikai://repo/facebook~~react/diff?filename=a%2Fb.js&source=pr&number=1";
    useDeepLinks(false);
    await Promise.resolve();
    expect(m.push).not.toHaveBeenCalled();

    useDeepLinks(true);
    await vi.waitFor(() =>
      expect(m.push).toHaveBeenCalledWith(
        "/repo/facebook~~react/diff?filename=a%2Fb.js&source=pr&number=1",
      ),
    );
  });

  it("handles an initial URL lookup failure without routing", async () => {
    m.getInitialURL.mockRejectedValueOnce(new Error("Linking unavailable"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      useDeepLinks(true);
      await vi.waitFor(() => expect(log).toHaveBeenCalledWith("Could not handle the initial link"));
      expect(m.push).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });

  // Android hands back the intent that created the task on every start, so the
  // same URL is "initial" again after a reload or a launcher launch.
  it("ignores the same link on the next start", async () => {
    m.initialUrl =
      "shikai://repo/facebook~~react/diff?filename=scripts%2Futils.js&source=pr&number=37778";

    useDeepLinks(true);
    await vi.waitFor(() => expect(m.push).toHaveBeenCalledOnce());

    useDeepLinks(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(m.push).toHaveBeenCalledOnce();
  });

  it("opens a different link after the first", async () => {
    m.initialUrl = "shikai://repo/facebook~~react/pull/1";
    useDeepLinks(true);
    await vi.waitFor(() => expect(m.push).toHaveBeenCalledOnce());

    m.initialUrl = "shikai://repo/facebook~~react/pull/2";
    useDeepLinks(true);
    await vi.waitFor(() => expect(m.push).toHaveBeenLastCalledWith("/repo/facebook~~react/pull/2"));
    expect(m.push).toHaveBeenCalledTimes(2);
  });

  // A plain start has no link intent, so the marker can go and a later tap of
  // the same link opens again.
  it("forgets the link when the app starts without one", async () => {
    m.initialUrl = "shikai://repo/facebook~~react/pull/1";
    useDeepLinks(true);
    await vi.waitFor(() => expect(m.push).toHaveBeenCalledOnce());

    m.initialUrl = null;
    useDeepLinks(true);
    await new Promise((r) => setTimeout(r, 0));

    m.initialUrl = "shikai://repo/facebook~~react/pull/1";
    useDeepLinks(true);
    await vi.waitFor(() => expect(m.push).toHaveBeenCalledTimes(2));
  });

  it("does not route the dev client link, and forgets the last link", async () => {
    m.initialUrl = "shikai://repo/facebook~~react/pr/1";
    useDeepLinks(true);
    await vi.waitFor(() => expect(m.push).toHaveBeenCalledOnce());

    // The dev client launches the app on every reload and rebuild. That is a
    // start without an app link, so it has to clear the marker.
    m.initialUrl = "shikai://expo-development-client/?url=http%3A%2F%2F10.0.0.2%3A8081";
    useDeepLinks(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(m.push).toHaveBeenCalledOnce();
    expect(m.openURL).not.toHaveBeenCalled();

    m.initialUrl = "shikai://repo/facebook~~react/pr/1";
    useDeepLinks(true);
    await vi.waitFor(() => expect(m.push).toHaveBeenCalledTimes(2));
  });

  it.each(["shikai://?code=abc", "shikai://"])("leaves %s alone", async (url) => {
    m.initialUrl = url;
    useDeepLinks(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(m.push).not.toHaveBeenCalled();
    expect(m.openURL).not.toHaveBeenCalled();
  });
});

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
    expect(m.push).toHaveBeenCalledWith(parseGitHubUrl("https://github.com/facebook/react/pull/1"));
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
