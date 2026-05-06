/**
 * Auth Guard
 *
 * Watches the Zustand token and redirects to sign-in if it's absent.
 * The boot sequence in the root layout ensures this only runs after
 * SecureStore has been read and Zustand has been hydrated.
 *
 * Flow:
 *   token present  → render <Slot /> (shows (tabs) navigator)
 *   token absent   → <Redirect href="/sign-in" />
 */

import { useAuthStore } from "@/stores/auth.store";
import { Redirect, Slot } from "expo-router";

export default function AppLayout() {
  const token = useAuthStore((s) => s.token);

  if (!token) {
    return <Redirect href="/sign-in" />;
  }

  return <Slot />;
}
