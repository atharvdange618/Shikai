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
  useAlert,
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
import {
  hasCompletedOnboarding,
  setOnboardingCompleteListener,
} from "@/app/(onboarding)/index";
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

// Rendered inside AlertProvider so it can prompt the user instead of
// silently reloading the app out from under them mid-session.
function OTAUpdateEffects() {
  const alert = useAlert();
  const { updateReady, reload } = useOTAUpdates();

  const alertRef = useRef(alert);
  alertRef.current = alert;
  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  useEffect(() => {
    if (!updateReady) return;
    alertRef.current.show({
      variant: "info",
      title: "Update ready",
      message: "Restart the app to get the latest version.",
      actions: [
        { text: "Later", style: "cancel" },
        { text: "Restart", onPress: () => reloadRef.current() },
      ],
    });
  }, [updateReady]);

  return null;
}

export default function RootLayout() {
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const setPat = useAuthStore((s) => s.setPat);
  useOnlineManager();
  const { visible, rate, dismiss } = useAppRatingPrompt();
  useInAppUpdates();

  const [bootComplete, setBootComplete] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(
    () => !useAuthStore.getState().token && !hasCompletedOnboarding(),
  );

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

  const fontsReady = Boolean(fontsLoaded || fontError);

  // Security check runs first, independent of auth boot, so a blocked
  // device never gets its stored token restored or used.
  useEffect(() => {
    if (fontsReady && securityStatus === "pending") {
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
  }, [fontsReady, securityStatus]);

  const bootStartedRef = useRef(false);

  useEffect(() => {
    if (securityStatus !== "passed" || bootStartedRef.current) return;
    bootStartedRef.current = true;

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
  }, [securityStatus, setToken, setUser, setPat]);

  // A blocked device never runs boot(), so it doesn't wait on bootComplete.
  const authPhaseComplete =
    securityStatus === "blocked" ||
    (securityStatus === "passed" && bootComplete);

  useEffect(() => {
    if (fontsReady && securityStatus !== "pending" && authPhaseComplete) {
      SplashScreen.hideAsync();
    }
  }, [fontsReady, securityStatus, authPhaseComplete]);

  const appReady = fontsReady && authPhaseComplete;

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
          <OTAUpdateEffects />
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
              <AppStack
                token={token}
                needsOnboarding={needsOnboarding}
                setNeedsOnboarding={setNeedsOnboarding}
              />
            </ErrorBoundary>
          )}
        </AlertProvider>
      </PersistQueryClientProvider>
    </ThemeProvider>
  );
}

function AppStack({
  token,
  needsOnboarding,
  setNeedsOnboarding,
}: {
  token: string | null;
  needsOnboarding: boolean;
  setNeedsOnboarding: (v: boolean) => void;
}) {
  const theme = useTheme();
  const router = useRouter();
  const prevTokenRef = useRef(token);
  const prevOnboardingRef = useRef(needsOnboarding);
  const mountedRef = useRef(false);

  useEffect(() => {
    setOnboardingCompleteListener(() => setNeedsOnboarding(false));
  }, [setNeedsOnboarding]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevTokenRef.current = token;
      prevOnboardingRef.current = needsOnboarding;

      if (token) {
        router.replace("/(app)/(tabs)/overview");
      } else if (!needsOnboarding) {
        router.replace("/sign-in");
      }
      return;
    }

    const prevToken = prevTokenRef.current;
    prevTokenRef.current = token;

    if (token && !prevToken) {
      router.replace("/(app)/(tabs)/overview");
    } else if (!token && prevToken) {
      router.replace("/sign-in");
    }
  }, [token, router, needsOnboarding]);

  useEffect(() => {
    prevOnboardingRef.current = needsOnboarding;
  }, [needsOnboarding]);

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
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
