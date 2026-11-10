import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "@/oauth-proxy/worker";

const env = { GITHUB_CLIENT_ID: "client-id", GITHUB_CLIENT_SECRET: "secret" };

function exchange() {
  return worker.fetch(
    new Request("https://proxy.test", {
      method: "POST",
      body: JSON.stringify({ client_id: "client-id", code: "abc", redirect_uri: "shikai://" }),
    }),
    env,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("oauth-proxy token exchange", () => {
  it("passes through only the token fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ access_token: "tok", token_type: "bearer", scope: "", extra: "x" }),
        ),
    );

    const res = await exchange();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ access_token: "tok", token_type: "bearer", scope: "" });
  });

  it("passes through GitHub's error field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ error: "bad_verification_code" })),
    );

    expect(await (await exchange()).json()).toEqual({ error: "bad_verification_code" });
  });

  it("returns a JSON 502 when GitHub answers with a 5xx page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>Unicorn</html>", { status: 503 })),
    );

    const res = await exchange();

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "github_unavailable" });
  });

  it("returns a JSON 502 when the GitHub call fails or times out", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("aborted", "AbortError")));

    const res = await exchange();

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "github_unavailable" });
  });

  it("returns a JSON 502 when GitHub's 200 body is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not json")));

    expect((await exchange()).status).toBe(502);
  });
});
