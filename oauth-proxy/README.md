# shikai-oauth-proxy

A Cloudflare Worker that swaps a GitHub OAuth `code` for an access token, so the
GitHub client secret never ships in the app. See `worker.ts`.

## Deploy

```
cd oauth-proxy
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler deploy
```

`GITHUB_CLIENT_ID` is public and lives in `wrangler.toml`. The secret is set
separately and is never committed.

## Abuse protection

The Worker is a public POST endpoint. Anyone can call it to drive GitHub's token
endpoint, so it needs a per-IP rate limit. This is a Cloudflare dashboard rule,
not code:

**Security → WAF → Rate limiting rules → Create rule**

- Name: `oauth-proxy token exchange`
- If incoming requests match: `Hostname equals <worker route host>` and
  `Request Method equals POST`
- Rate: `10 requests per 1 minute` per client IP
- Then: `Block` for `1 minute`
- Response: `429`

Ten per minute is well above a real sign-in (one exchange per attempt) and low
enough to make scripted abuse pointless. Adjust down if logs stay quiet.
