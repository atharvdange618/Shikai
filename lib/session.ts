import type { QueryClient } from "@tanstack/react-query";

import { GitHubApiError } from "@/lib/axios";
import { fetchAuthenticatedUser, fetchPATOwner } from "@/lib/github-rest";
import { clearAllMMKV } from "@/lib/mmkv";
import { queryKeys } from "@/lib/query-client";
import { deletePAT, deleteToken, getStoredPAT } from "@/lib/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

export async function revalidateSession(queryClient: QueryClient): Promise<void> {
  try {
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
  useAuthStore.getState().clearAuth();
  queryClient.clear();
  clearAllMMKV();
}

export async function restorePATFor(login: string): Promise<string | null> {
  const pat = await getStoredPAT();
  if (!pat) return null;

  try {
    if ((await fetchPATOwner(pat)).toLowerCase() === login.toLowerCase()) {
      return pat;
    }
  } catch {}
  await deletePAT();
  return null;
}
