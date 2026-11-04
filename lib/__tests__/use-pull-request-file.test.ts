import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  fetchNextPage: vi.fn(),
  state: {
    items: [] as { filename: string }[],
    hasNextPage: false as boolean | undefined,
    isFetchingNextPage: false,
    isLoading: false,
    isError: false,
  },
}));

// Effects run inline, so each call to the hook is one render.
vi.mock("react", () => ({
  useEffect: (effect: () => void) => effect(),
}));
vi.mock("@tanstack/react-query", () => ({
  queryOptions: <T>(o: T) => o,
  useQuery: vi.fn(),
}));
vi.mock("@/lib/github-rest", () => ({}));
vi.mock("@/lib/query-client", () => ({
  queryKeys: { prFiles: () => ["prFiles"] },
}));
vi.mock("@/hooks/useInfinitePagedQuery", () => ({
  useInfinitePagedQuery: () => ({
    ...m.state,
    fetchNextPage: m.fetchNextPage,
    error: null,
    refetch: vi.fn(),
  }),
}));

import { usePullRequestFile } from "@/hooks/usePullRequestDetail";

const render = (filename: string) =>
  usePullRequestFile("facebook", "react", 1, filename);

describe("usePullRequestFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.state = {
      items: [{ filename: "a.ts" }],
      hasNextPage: true,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
    };
  });

  it("returns a file from the loaded pages without fetching more", () => {
    const r = render("a.ts");
    expect(r.file?.filename).toBe("a.ts");
    expect(r.isLoading).toBe(false);
    expect(m.fetchNextPage).not.toHaveBeenCalled();
  });

  it("loads the next page while the file is missing", () => {
    const r = render("later.ts");
    expect(r.file).toBeUndefined();
    expect(r.isLoading).toBe(true);
    expect(m.fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("finds the file once a later page arrives", () => {
    render("later.ts");
    m.state.items = [...m.state.items, { filename: "later.ts" }];
    m.state.hasNextPage = false;
    const r = render("later.ts");
    expect(r.file?.filename).toBe("later.ts");
    expect(r.isLoading).toBe(false);
  });

  it("waits for a page already in flight", () => {
    m.state.isFetchingNextPage = true;
    expect(render("later.ts").isLoading).toBe(true);
    expect(m.fetchNextPage).not.toHaveBeenCalled();
  });

  it("stops loading when the pages run out", () => {
    m.state.hasNextPage = false;
    const r = render("missing.ts");
    expect(r.file).toBeUndefined();
    expect(r.isLoading).toBe(false);
    expect(m.fetchNextPage).not.toHaveBeenCalled();
  });

  it("stops fetching after a page fails, so it doesn't retry in a loop", () => {
    m.state.isError = true;
    expect(render("later.ts").isLoading).toBe(false);
    expect(m.fetchNextPage).not.toHaveBeenCalled();
  });
  it("keeps a loaded file readable when a later page fails", () => {
    m.state.isError = true;
    const r = render("a.ts");
    expect(r.file?.filename).toBe("a.ts");
    expect(r.isError).toBe(false);
    expect(r.isLoading).toBe(false);
    expect(m.fetchNextPage).not.toHaveBeenCalled();
  });
});
