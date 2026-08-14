import { makeRedirectUri } from "expo-auth-session";

import { githubAxios } from "@/lib/axios";
import { fetchAuthenticatedUser } from "@/lib/github-rest";
import {
  clearPendingAuth,
  getPendingAuth,
  getStoredPAT,
  saveToken,
} from "@/lib/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

const CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID!;
const OAUTH_PROXY_URL = process.env.EXPO_PUBLIC_OAUTH_PROXY_URL!;

const redirectUri = makeRedirectUri({ scheme: "shikai" });

export async function exchangeGithubCode(
  code: string,
): Promise<{ ok: boolean }> {
  const pendingAuth = await getPendingAuth();
  if (!pendingAuth) return { ok: false };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let accessToken: string;

    try {
      const tokenResponse = await fetch(OAUTH_PROXY_URL, {
        signal: controller.signal,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          code,
          redirect_uri: redirectUri,
          code_verifier: pendingAuth.codeVerifier,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error || !tokenData.access_token) {
        await clearPendingAuth();
        return { ok: false };
      }

      accessToken = tokenData.access_token;
    } finally {
      clearTimeout(timeoutId);
    }

    await clearPendingAuth();
    await saveToken(accessToken);

    githubAxios.defaults.headers.common["Authorization"] =
      `Bearer ${accessToken}`;

    const storedPAT = await getStoredPAT();
    if (storedPAT) useAuthStore.getState().setPat(storedPAT);

    useAuthStore.getState().setToken(accessToken);

    const user = await fetchAuthenticatedUser();
    useAuthStore.getState().setUser(user);

    return { ok: true };
  } catch {
    await clearPendingAuth();
    return { ok: false };
  }
}
