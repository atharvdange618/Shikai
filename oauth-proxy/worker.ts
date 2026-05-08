interface Env {
  GITHUB_CLIENT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const body = await request.json();
    const { code, code_verifier, redirect_uri, client_id } = body;

    if (!code || !client_id) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const params = new URLSearchParams();
    params.set("client_id", client_id);
    params.set("client_secret", env.GITHUB_CLIENT_SECRET);
    params.set("code", code);
    if (redirect_uri) params.set("redirect_uri", redirect_uri);
    if (code_verifier) params.set("code_verifier", code_verifier);

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  },
};
