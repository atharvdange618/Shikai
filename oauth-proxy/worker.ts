// Public POST endpoint. Per-IP rate limiting is a Cloudflare dashboard rule,
// not code here. See README.md.
interface Env {
  GITHUB_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
}

const EXPECTED_REDIRECT_URI = "shikai://";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { code, code_verifier, redirect_uri, client_id } = body;

    if (typeof code !== "string" || !code) {
      return Response.json({ error: "Missing or invalid code" }, { status: 400 });
    }
    if (typeof client_id !== "string" || client_id !== env.GITHUB_CLIENT_ID) {
      return Response.json({ error: "Invalid client_id" }, { status: 403 });
    }

    const params = new URLSearchParams();
    params.set("client_id", client_id);
    params.set("client_secret", env.GITHUB_CLIENT_SECRET);
    params.set("code", code);
    if (typeof redirect_uri === "string" && redirect_uri) {
      if (!redirect_uri.startsWith(EXPECTED_REDIRECT_URI)) {
        return Response.json({ error: "Invalid redirect_uri" }, { status: 403 });
      }
      params.set("redirect_uri", redirect_uri);
    }
    if (typeof code_verifier === "string" && code_verifier) {
      params.set("code_verifier", code_verifier);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch("https://github.com/login/oauth/access_token", {
        signal: controller.signal,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = (await response.json()) as Record<string, unknown>;
      const safe: Record<string, unknown> = {};
      if (typeof data.access_token === "string") safe.access_token = data.access_token;
      if (typeof data.token_type === "string") safe.token_type = data.token_type;
      if (typeof data.scope === "string") safe.scope = data.scope;
      if (data.error) safe.error = data.error;
      return Response.json(safe, { status: response.status });
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
