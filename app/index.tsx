import { useAuthStore } from "@/stores/auth.store";
import { Href, Redirect } from "expo-router";

export default function Index() {
  const token = useAuthStore((s) => s.token);

  if (token) {
    return <Redirect href={"/(app)/(tabs)" as Href} />;
  }

  return <Redirect href="/token-setup" />;
}
