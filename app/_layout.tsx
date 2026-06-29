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
import type { Query } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { StatusBar, useColorScheme } from "react-native";

import { AnimatedSplashScreen, BlockingScreen, ErrorBoundary } from "@/components";
import { OfflineBanner } from "@/components/OfflineBanner";
import { DarkColors, LightColors } from "@/constants/theme";
import { fetchAuthenticatedUser } from "@/lib/github-rest";
import { mmkvPersister, PERSISTENCE_MAX_AGE } from "@/lib/persister";
import { queryClient, setupFocusManager } from "@/lib/query-client";
import { getStoredToken } from "@/lib/secure-storage";
import { useOnlineManager } from "@/lib/use-online-manager";
import { useAuthStore } from "@/stores/auth.store";
import { runSecurityChecks } from "shikai-security";

SplashScreen.preventAutoHideAsync();

setupFocusManager();

export default function RootLayout() {
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const scheme = useColorScheme();
  useOnlineManager();

  const [bootComplete, setBootComplete] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const [securityStatus, setSecurityStatus] = useState<
    "pending" | "passed" | "blocked"
  >("pending");
  const [securityReasons, setSecurityReasons] = useState<string[]>([]);
  const [devModeBlocked, setDevModeBlocked] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(
      scheme === "dark" ? DarkColors.background : LightColors.background,
    );
  }, [scheme]);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;

    async function boot() {
      try {
        const storedToken = await getStoredToken();

        if (storedToken) {
          try {
            useAuthStore.getState().setToken(storedToken);
            const user = await fetchAuthenticatedUser();
            setUser(user);
          } catch {
            useAuthStore.getState().clearAuth();
          }
        }
      } catch {
        // No stored token - routing handles sending user to sign-in
      } finally {
        setBootComplete(true);
      }
    }

    if (!useAuthStore.getState().token) {
      boot();
    } else {
      setBootComplete(true);
    }
  }, [fontsLoaded, fontError, setToken, setUser]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const appReady = bootComplete && Boolean(fontsLoaded || fontError);

  useEffect(() => {
    if (appReady && securityStatus === "pending") {
      runSecurityChecks().then((result) => {
        if (result.isBlocked) {
          setSecurityStatus("blocked");
          setSecurityReasons(result.reasons);
          setDevModeBlocked(result.devModeBlocked);
        } else {
          setSecurityStatus("passed");
        }
      });
    }
  }, [appReady, securityStatus]);

  const handleRecheck = useCallback(async () => {
    const result = await runSecurityChecks();
    if (result.isBlocked) {
      setSecurityReasons(result.reasons);
      setSecurityStatus("blocked");
      setDevModeBlocked(result.devModeBlocked);
    } else {
      setSecurityStatus("passed");
    }
  }, []);

  const recheckRef = useRef(handleRecheck);
  recheckRef.current = handleRecheck;

  useEffect(() => {
    if (securityStatus !== "blocked") return;

    const interval = setInterval(() => {
      recheckRef.current();
    }, 10000);

    return () => clearInterval(interval);
  }, [securityStatus]);

  const securityReady = securityStatus !== "pending";
  const allReady = appReady && securityReady;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: mmkvPersister,
        maxAge: PERSISTENCE_MAX_AGE,
        dehydrateOptions: {
          shouldDehydrateQuery: (query: Query) =>
            query.state.status === "success" && query.meta?.persist !== false,
        },
      }}
    >
      <OfflineBanner />
      <StatusBar
        barStyle={scheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      {showSplash && (
        <AnimatedSplashScreen
          isReady={allReady}
          onComplete={() => setShowSplash(false)}
        />
      )}
      {!showSplash && securityStatus === "blocked" && (
        <BlockingScreen
          reasons={securityReasons}
          devModeBlocked={devModeBlocked}
          onOverride={handleRecheck}
        />
      )}
      {!showSplash && securityStatus === "passed" && (
        <ErrorBoundary>
          <Stack screenOptions={{ headerShown: false }}>
            {token ? (
              <Stack.Screen name="(app)" />
            ) : (
              <Stack.Screen name="sign-in" />
            )}
          </Stack>
        </ErrorBoundary>
      )}
    </PersistQueryClientProvider>
  );
}
