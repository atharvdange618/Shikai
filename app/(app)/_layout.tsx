/**
 * Auth Guard
 *
 * This layout sits between the root stack and the tab navigator.
 * Its only job is to watch the Zustand token and redirect accordingly.
 *
 * Why a separate layout instead of doing this in the root?
 * Expo Router's <Redirect /> only works inside a layout that owns the
 * relevant route segment. The root layout owns both `token-setup` and
 * `(app)` — if we redirected from there we'd get infinite redirect loops.
 * This layout owns the `(app)` segment, so redirecting to `../token-setup`
 * from here is clean and loop-free.
 *
 * Flow:
 *   token present  → render <Slot /> (shows (tabs) navigator)
 *   token absent   → <Redirect href="/token-setup" />
 *
 * The boot sequence in the root layout ensures this component only
 * renders after SecureStore has been read and Zustand has been hydrated.
 * So by the time this guard runs, `token` reflects ground truth.
 */

import { useAuthStore } from "@/stores/auth.store";
import { Redirect, Slot } from "expo-router";

export default function AppLayout() {
  const token = useAuthStore((s) => s.token);

  if (!token) {
    return <Redirect href="/token-setup" />;
  }

  return <Slot />;
}
