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
import { ShareIntentProvider } from "expo-share-intent";
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type Dispatch,
} from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AnimatedSplashScreen } from "@/components/AnimatedSplashScreen";
import { BlockingScreen } from "@/components/BlockingScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AlertProvider, useAlert } from "@/components/shared/Alert";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { useDeepLinks } from "@/hooks/useDeepLinks";
import { useNotificationTaps } from "@/hooks/useNotificationTaps";
import { useReviewPrompt } from "@/hooks/useReviewPrompt";
import { useInAppUpdates } from "@/hooks/useInAppUpdates";
import { setAuthReady } from "@/lib/axios";
import { bootReducer, initialBootState, type BootAction } from "@/lib/boot-flow";
import { PERSISTENCE_MAX_AGE, mmkvPersister } from "@/lib/persister";
import { queryClient, queryKeys, setupFocusManager } from "@/lib/query-client";
import { getStoredPAT, getStoredToken } from "@/lib/secure-storage";
import { revalidateSession } from "@/lib/session";
import { useOnlineManager } from "@/lib/use-online-manager";
import { useOTAUpdates } from "@/lib/use-ota-updates";
import { useAuthStore } from "@/stores/auth.store";
import type { GitHubUser } from "@/types/github.types";
import { runSecurityChecks } from "shikai-security";
import * as Sentry from "@sentry/react-native";

SplashScreen.preventAutoHideAsync();

setupFocusManager();

function ThemeEffects() {
  const theme = useTheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background);
  }, [theme.colors.background]);

  return (
    <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
  );
}

// Rendered inside AlertProvider so it can prompt the user instead of
// silently reloading the app out from under them mid-session.
function OTAUpdateEffects() {
  const alert = useAlert();
  const { updateReady, reload } = useOTAUpdates();

  const alertRef = useRef(alert);
  const reloadRef = useRef(reload);

  useEffect(() => {
    alertRef.current = alert;
  }, [alert]);
  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

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

export default Sentry.wrap(function RootLayout() {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  const setPat = useAuthStore((s) => s.setPat);
  useOnlineManager();
  useInAppUpdates();

  const [state, dispatch] = useReducer(bootReducer, initialBootState);
  const [showSplash, setShowSplash] = useState(true);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  const fontsReady = Boolean(fontsLoaded || fontError);

  // Runs on mount, independent of fonts and of auth boot, so a blocked device
  // never gets its stored token restored or used. Fonts only decide when text
  // can paint, so they must not sit in front of this.
  useEffect(() => {
    if (state.phase !== "checkingSecurity") return;

    runSecurityChecks().then((result) => {
      if (result.isBlocked) {
        dispatch({
          type: "SECURITY_BLOCKED",
          reasons: result.reasons,
          devModeBlocked: result.devModeBlocked,
        });
      } else {
        dispatch({ type: "SECURITY_PASSED" });
      }
    });
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "restoringAuth") return;

    async function boot() {
      let hasSession = false;

      try {
        // Both are Keystore round trips, so read them together.
        const [storedPAT, storedToken] = await Promise.all([
          getStoredPAT(),
          getStoredToken(),
        ]);

        if (storedPAT) setPat(storedPAT);

        if (storedToken) {
          hasSession = true;
          useAuthStore.getState().setToken(storedToken);

          // Best effort: the persisted query cache may still be restoring. The
          // profile only feeds the greeting; useUser() covers the rest.
          const cached = queryClient.getQueryData<GitHubUser>(queryKeys.user());
          if (cached) setUser(cached);
        }
      } catch {
        // Storage failed. Routing sends the user to sign-in.
      } finally {
        // Boot ends here, not on a network round trip. GET /user can take up
        // to the axios timeout, and a splash is the wrong place to wait.
        dispatch({ type: "AUTH_RESTORE_COMPLETE" });
        setAuthReady(true);
      }

      // Checked after the app is already on screen. A 401 signs out, anything
      // else leaves the session as restored.
      if (hasSession) void revalidateSession(queryClient);
    }

    if (!useAuthStore.getState().token) {
      boot();
    } else {
      dispatch({ type: "AUTH_RESTORE_COMPLETE" });
      setAuthReady(true);
    }
  }, [state.phase, setPat, setUser]);

  const bootPhaseComplete = state.phase === "blocked" || state.phase === "ready";

  const appReady = fontsReady && bootPhaseComplete;

  const handleRecheck = useCallback(async () => {
    const result = await runSecurityChecks();
    if (result.isBlocked) {
      dispatch({
        type: "SECURITY_BLOCKED",
        reasons: result.reasons,
        devModeBlocked: result.devModeBlocked,
      });
    } else {
      dispatch({ type: "SECURITY_PASSED" });
    }
  }, []);

  useEffect(() => {
    if (state.phase !== "blocked") return;

    const interval = setInterval(() => {
      handleRecheck();
    }, 10000);

    return () => clearInterval(interval);
  }, [state.phase, handleRecheck]);

  const securityReady = state.phase !== "checkingSecurity";
  const allReady = appReady && securityReady;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ShareIntentProvider options={{ resetOnBackground: true }}>
        <ThemeProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister: mmkvPersister,
              maxAge: PERSISTENCE_MAX_AGE,
              dehydrateOptions: {
                shouldDehydrateQuery: (query: Query) =>
                  query.state.status === "success" &&
                  query.meta?.persist !== false,
              },
            }}
          >
            <AlertProvider>
              <OfflineBanner />
              <ThemeEffects />
              <OTAUpdateEffects />
              {showSplash && (
                <AnimatedSplashScreen
                  isReady={allReady}
                  onComplete={() => setShowSplash(false)}
                />
              )}
              {!showSplash && state.phase === "blocked" && (
                <BlockingScreen
                  reasons={state.reasons}
                  devModeBlocked={state.devModeBlocked}
                  onOverride={handleRecheck}
                />
              )}
              {!showSplash && state.phase === "ready" && (
                <ErrorBoundary>
                  <AppStack
                    token={token}
                    lastRoutedToken={state.lastRoutedToken}
                    dispatch={dispatch}
                  />
                </ErrorBoundary>
              )}
            </AlertProvider>
          </PersistQueryClientProvider>
        </ThemeProvider>
      </ShareIntentProvider>
    </GestureHandlerRootView>
  );
});

function AppStack({
  token,
  lastRoutedToken,
  dispatch,
}: {
  token: string | null;
  lastRoutedToken: string | null | undefined;
  dispatch: Dispatch<BootAction>;
}) {
  const theme = useTheme();
  const router = useRouter();

  useReviewPrompt(Boolean(token));

  useEffect(() => {
    dispatch({ type: "TOKEN_CHANGED", token });
  }, [token, dispatch]);

  useEffect(() => {
    if (lastRoutedToken === undefined) return;
    router.replace(lastRoutedToken ? "/(app)/(tabs)/overview" : "/sign-in");
  }, [lastRoutedToken, router]);

  // Called after the replace above and gated on it, so a link, share or alert
  // tap that arrives during boot opens on top of overview instead of being
  // replaced.
  const routed = Boolean(token) && lastRoutedToken === token;
  useDeepLinks(routed);
  useNotificationTaps(routed);

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
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
