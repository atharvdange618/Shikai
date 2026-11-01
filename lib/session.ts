import type { QueryClient } from "@tanstack/react-query";

import { GitHubApiError } from "@/lib/axios";
import { fetchAuthenticatedUser, fetchPATOwner } from "@/lib/github-rest";
import { clearAllMMKV } from "@/lib/mmkv";
import { queryKeys } from "@/lib/query-client";
import { deletePAT, deleteToken, getStoredPAT } from "@/lib/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Checks a restored token with `GET /user` without holding up boot.
 *
 * A 401 signs the user out: the token is dead and every screen would fail
 * anyway. Anything else leaves the session alone, because a token that can't
 * be checked is not a bad token. Boot used to wait on this call, so opening
 * the app offline cleared auth (status 0 landed in the same catch) and a slow
 * network held the splash for up to the 15s axios timeout.
 */
export async function revalidateSession(
  queryClient: QueryClient,
): Promise<void> {
  try {
    // staleTime 0 forces the round trip even when the persisted profile is
    // fresh, so a revoked token is caught on the first boot and not in 30 min.
    const user = await queryClient.fetchQuery({
      queryKey: queryKeys.user(),
      queryFn: fetchAuthenticatedUser,
      staleTime: 0,
    });
    useAuthStore.getState().setUser(user);
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 401) {
      useAuthStore.getState().clearAuth();
    }
  }
}

/**
 * Signs the user out and removes everything tied to their account. The PAT
 * goes too, so it can't follow this account into the next one.
 */
export async function signOut(queryClient: QueryClient): Promise<void> {
  await deleteToken();
  await deletePAT();
  // Also stops notification alerts, via the auth store subscription in
  // lib/background-notifications.ts.
  useAuthStore.getState().clearAuth();
  queryClient.clear();
  clearAllMMKV();
}

/**
 * Returns the stored PAT if it belongs to `login`, the account signing in.
 * Otherwise deletes it and returns null. signOut() already removes the PAT,
 * but a 401 mid-session or a failed token check at boot keeps it, and
 * without this check the next account to sign in would pick it up.
 *
 * If ownership can't be confirmed (PAT revoked, offline, rate limited) the
 * PAT is deleted too: re-pasting a token is cheap, showing one account's
 * notifications to another isn't.
 */
export async function restorePATFor(login: string): Promise<string | null> {
  const pat = await getStoredPAT();
  if (!pat) return null;

  try {
    // GitHub logins are case-insensitive.
    if ((await fetchPATOwner(pat)).toLowerCase() === login.toLowerCase()) {
      return pat;
    }
  } catch {
    // Fall through: unconfirmed counts as a mismatch.
  }
  await deletePAT();
  return null;
}
