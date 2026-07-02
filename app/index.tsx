import { Redirect } from "expo-router";

import { useAuthStore } from "@/stores/auth.store";

export default function Index() {
  const token = useAuthStore((s) => s.token);
  return token ? (
    <Redirect href="/(app)/(tabs)/overview" />
  ) : (
    <Redirect href="/sign-in" />
  );
}
