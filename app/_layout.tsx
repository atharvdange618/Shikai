import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

import { AnimatedSplashScreen } from "@/components/AnimatedSplashScreen";
import { fetchAuthenticatedUser } from "@/lib/github-rest";
import { queryClient, setupFocusManager } from "@/lib/query-client";
import { getStoredToken } from "@/lib/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

SplashScreen.preventAutoHideAsync();

setupFocusManager();

export default function RootLayout() {
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [bootComplete, setBootComplete] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    async function boot() {
      try {
        const storedToken = await getStoredToken();

        if (storedToken) {
          setToken(storedToken);

          try {
            const user = await fetchAuthenticatedUser();
            setUser(user);
          } catch {
            useAuthStore.getState().clearAuth();
          }
        }
      } catch {
        // no need to do anything here, we'll just show the login screen
      } finally {
        setBootComplete(true);
      }
    }

    boot();
  }, [fontsLoaded, fontError, setToken, setUser]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const appReady = bootComplete && Boolean(fontsLoaded || fontError);

  return (
    <QueryClientProvider client={queryClient}>
      {showSplash && (
        <AnimatedSplashScreen
          isReady={appReady}
          onComplete={() => setShowSplash(false)}
        />
      )}
      {!showSplash && (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="token-setup" />
          <Stack.Screen name="(app)" />
        </Stack>
      )}
    </QueryClientProvider>
  );
}
