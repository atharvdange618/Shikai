import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  push: vi.fn(),
  markNotificationAsRead: vi.fn(),
  response: null as unknown,
}));

// Effects run inline on each call, so calling the hook again is a re-render.
vi.mock("react", () => ({
  useEffect: (effect: () => void) => effect(),
  useRef: <T>(current: T) => ({ current }),
}));
vi.mock("expo-router", () => ({ useRouter: () => ({ push: m.push }) }));
vi.mock("expo-notifications", () => ({
  DEFAULT_ACTION_IDENTIFIER: "default",
  useLastNotificationResponse: () => m.response,
  clearLastNotificationResponseAsync: () => Promise.resolve(),
}));
vi.mock("@/lib/github-rest", () => ({
  markNotificationAsRead: m.markNotificationAsRead,
}));
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: { getState: () => ({ pat: null }) },
}));

import { useNotificationTaps } from "@/hooks/useNotificationTaps";
import { parseGitHubApiUrl } from "@/lib/github-url";

const subjectUrl = "https://api.github.com/repos/atharvdange618/Shikai/pulls/16";

describe("useNotificationTaps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.response = {
      actionIdentifier: "default",
      notification: {
        request: {
          identifier: "tap-1",
          content: { data: { subjectUrl, threadId: "dev-test" } },
        },
      },
    };
  });

  it("holds a cold-start tap until enabled, then opens its thread", () => {
    useNotificationTaps(false);
    expect(m.push).not.toHaveBeenCalled();

    useNotificationTaps(true);
    expect(m.push).toHaveBeenCalledWith(parseGitHubApiUrl(subjectUrl));
  });

  it("opens the notifications tab for the summary alert", () => {
    m.response = {
      actionIdentifier: "default",
      notification: { request: { identifier: "tap-2", content: { data: {} } } },
    };
    useNotificationTaps(true);
    expect(m.push).toHaveBeenCalledWith("/(app)/(tabs)/notifications");
  });
});
