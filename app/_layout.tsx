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
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { StatusBar } from "react-native";

import {
  AlertProvider,
  AnimatedSplashScreen,
  BlockingScreen,
  ErrorBoundary,
} from "@/components";
import { AppRatingPrompt } from "@/components/AppRatingPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { useAppRatingPrompt } from "@/hooks/useAppRatingPrompt";
import { useInAppUpdates } from "@/hooks/useInAppUpdates";
import { setAuthReady } from "@/lib/axios";
import { fetchAuthenticatedUser } from "@/lib/github-rest";
import { PERSISTENCE_MAX_AGE, mmkvPersister } from "@/lib/persister";
import { queryClient, setupFocusManager } from "@/lib/query-client";
import { getStoredPAT, getStoredToken } from "@/lib/secure-storage";
import { useOnlineManager } from "@/lib/use-online-manager";
import { useOTAUpdates } from "@/lib/use-ota-updates";
import { useAuthStore } from "@/stores/auth.store";
import { runSecurityChecks } from "shikai-security";

SplashScreen.preventAutoHideAsync();

setupFocusManager();

function ThemeEffects() {
  const theme = useTheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background);
  }, [theme.colors.background]);

  return (
    <StatusBar
      barStyle={theme.isDark ? "light-content" : "dark-content"}
      backgroundColor="transparent"
      translucent
    />
  );
}

export default function RootLayout() {
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const setPat = useAuthStore((s) => s.setPat);
  useOnlineManager();
  useOTAUpdates();
  const { visible, rate, dismiss } = useAppRatingPrompt();
  useInAppUpdates();

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
    if (!fontsLoaded && !fontError) return;

    async function boot() {
      try {
        const storedPAT = await getStoredPAT();
        if (storedPAT) setPat(storedPAT);

        const storedToken = await getStoredToken();
        if (storedToken) {
          try {
            useAuthStore.getState().setToken(storedToken);
            const user = await fetchAuthenticatedUser();
            setUser(user);
          } catch {
            useAuthStore.getState().clearAuth();
            if (storedPAT) setPat(storedPAT);
          }
        }
      } catch {
        // No stored token - routing handles sending user to sign-in
      } finally {
        setBootComplete(true);
        setAuthReady(true);
      }
    }

    if (!useAuthStore.getState().token) {
      boot();
    } else {
      setBootComplete(true);
      setAuthReady(true);
    }
  }, [fontsLoaded, fontError, setToken, setUser, setPat]);

  useEffect(() => {
    if (
      (fontsLoaded || fontError) &&
      bootComplete &&
      securityStatus !== "pending"
    ) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, bootComplete, securityStatus]);

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
    <ThemeProvider>
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
        <AlertProvider>
          <OfflineBanner />
          <AppRatingPrompt visible={visible} onRate={rate} onDismiss={dismiss} />
          <ThemeEffects />
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
              <AppStack token={token} />
            </ErrorBoundary>
          )}
        </AlertProvider>
      </PersistQueryClientProvider>
    </ThemeProvider>
  );
}

function AppStack({ token }: { token: string | null }) {
  const theme = useTheme();
  const router = useRouter();
  const prevTokenRef = useRef(token);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevTokenRef.current = token;
      return;
    }

    const prevToken = prevTokenRef.current;
    prevTokenRef.current = token;

    if (token && !prevToken) {
      router.replace("/(app)/(tabs)/overview");
    } else if (!token && prevToken) {
      router.replace("/sign-in");
    }
  }, [token, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      {token ? <Stack.Screen name="(app)" /> : <Stack.Screen name="sign-in" />}
    </Stack>
  );
}
