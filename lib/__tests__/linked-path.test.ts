import { beforeEach, describe, expect, it, vi } from "vitest";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/lib/axios", () => ({ githubAxios: { post } }));

import { resolveLinkedPath } from "@/lib/github-graphql";

describe("resolveLinkedPath", () => {
  beforeEach(() => post.mockReset());

  it("chooses the longest matching branch and preserves the remaining file path", async () => {
    post.mockResolvedValueOnce({
      data: {
        data: { repository: { r0: null, r1: { oid: "feature-sha" }, r2: { oid: "shorter" } } },
      },
    });

    await expect(
      resolveLinkedPath("o", "r", ["feature", "docs", "src", "readme.md"], "blob"),
    ).resolves.toEqual({ ref: "feature/docs", revision: "feature-sha", path: "src/readme.md" });
    expect(post.mock.calls[0][1]).toMatchObject({
      variables: {
        owner: "o",
        name: "r",
        r0: "feature/docs/src^{commit}",
        r1: "feature/docs^{commit}",
        r2: "feature^{commit}",
      },
    });
  });

  it.each(["preview", "v1.9.0", "e91e7ba"])("resolves the ref %s for a tree", async (ref) => {
    post.mockResolvedValueOnce({
      data: { data: { repository: { r0: null, r1: { oid: "resolved-sha" } } } },
    });
    await expect(resolveLinkedPath("o", "r", [ref, "docs"], "tree")).resolves.toEqual({
      ref,
      revision: "resolved-sha",
      path: "docs",
    });
  });

  it("keeps a slash encoded into the ref separate from the folder path", async () => {
    post.mockResolvedValueOnce({ data: { data: { repository: { r0: { oid: "resolved-sha" } } } } });
    await expect(resolveLinkedPath("o", "r", ["release/next", "docs"], "tree")).resolves.toEqual({
      ref: "release/next",
      revision: "resolved-sha",
      path: "docs",
    });
    expect(post.mock.calls[0][1]).toMatchObject({
      variables: { r0: "release/next^{commit}" },
    });
  });

  it("rejects a missing ref without falling back to the default branch", async () => {
    post.mockResolvedValueOnce({ data: { data: { repository: { r0: null } } } });
    await expect(resolveLinkedPath("o", "r", ["missing", "file.ts"], "blob")).rejects.toThrow(
      "GitHub could not find the revision in this link.",
    );
  });
});
