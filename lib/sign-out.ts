import type { QueryClient } from "@tanstack/react-query";

import { clearAllMMKV } from "@/lib/mmkv";
import { deletePAT, deleteToken } from "@/lib/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Signs the user out and removes everything tied to their account. The PAT
 * goes too: sign-in restores a stored PAT for whoever signs in next, so
 * leaving it would hand one account's notifications to another.
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
