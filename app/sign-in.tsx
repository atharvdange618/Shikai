import { Octicons } from "@expo/vector-icons";
import { makeRedirectUri } from "expo-auth-session";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { Href, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  FontFamily,
  FontSize,
  Radius,
  Shadows,
  Spacing,
  useTheme,
  type ColorTokens,
} from "@/constants/theme";
import { githubAxios } from "@/lib/axios";
import {
  fetchAuthenticatedUser,
  fetchUserInstallations,
} from "@/lib/github-rest";
import { clearAllMMKV } from "@/lib/mmkv";
import { prefetchOverview } from "@/lib/prefetch";
import { queryClient, queryKeys } from "@/lib/query-client";
import {
  clearPendingAuth,
  getPendingAuth,
  getStoredPAT,
  savePendingAuth,
  saveToken,
} from "@/lib/secure-storage";
import { useAuthStore } from "@/stores/auth.store";
import { useSignInStore } from "@/stores/signin.store";

const CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID!;
const APP_SLUG = process.env.EXPO_PUBLIC_GITHUB_APP_SLUG!;
const OAUTH_PROXY_URL = process.env.EXPO_PUBLIC_OAUTH_PROXY_URL!;
const SCOPES = ["read:user", "user:email", "repo:status", "read:repo"].join(
  ",",
);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SignInScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const shadows = useMemo(() => (isDark ? {} : Shadows.light.md), [isDark]);
  const insets = useSafeAreaInsets();

  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const setPat = useAuthStore((s) => s.setPat);

  const isLoading = useSignInStore((s) => s.isLoading);
  const error = useSignInStore((s) => s.error);
  const needsInstall = useSignInStore((s) => s.needsInstall);

  useEffect(() => {
    return () => {
      useSignInStore.getState().reset();
    };
  }, []);

  const redirectUri = makeRedirectUri({ scheme: "shikai" });

  const completeAuth = useCallback(
    async (code: string, codeVerifier: string) => {
      const { setLoading, setError, setNeedsInstall, setPendingToken } =
        useSignInStore.getState();

      setLoading(true);
      setError(null);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        let accessToken: string;

        try {
          const tokenResponse = await fetch(OAUTH_PROXY_URL, {
            signal: controller.signal,
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              client_id: CLIENT_ID,
              code,
              redirect_uri: redirectUri,
              code_verifier: codeVerifier,
            }),
          });

          const tokenData = await tokenResponse.json();

          if (tokenData.error || !tokenData.access_token) {
            setError("Could not get access token. Please try again.");
            setLoading(false);
            await clearPendingAuth();
            return;
          }

          accessToken = tokenData.access_token;
        } finally {
          clearTimeout(timeoutId);
        }

        await clearPendingAuth();

        githubAxios.defaults.headers.common["Authorization"] =
          `Bearer ${accessToken}`;

        const installations = await fetchUserInstallations();

        if (installations.length === 0) {
          setPendingToken(accessToken);
          setLoading(false);
          setNeedsInstall(true);
          return;
        }

        const [, user] = await Promise.all([
          saveToken(accessToken),
          fetchAuthenticatedUser(),
        ]);

        const storedPAT = await getStoredPAT();
        if (storedPAT) setPat(storedPAT);

        setToken(accessToken);
        setUser(user);

        clearAllMMKV();
        queryClient.clear();
        queryClient.setQueryData(queryKeys.user(), user);
        prefetchOverview(queryClient, user.login);

        setLoading(false);
        router.replace("/(app)/(tabs)/overview" as Href);
      } catch {
        setError("Something went wrong. Check your connection and try again.");
        setLoading(false);
        await clearPendingAuth();
      }
    },
    [redirectUri, setToken, setUser, router, setPat],
  );

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const parsed = Linking.parse(event.url);
      const code = parsed.queryParams?.code as string | undefined;
      if (!code) return;

      const pendingAuth = await getPendingAuth();
      if (!pendingAuth) return;

      await completeAuth(code, pendingAuth.codeVerifier);
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    const subscription = Linking.addEventListener("url", handleDeepLink);
    return () => subscription.remove();
  }, [completeAuth]);

  useEffect(() => {
    const recoverPendingAuth = async () => {
      const pendingAuth = await getPendingAuth();
      if (pendingAuth) {
        useSignInStore.getState().setLoading(true);
      }
    };
    recoverPendingAuth();
  }, []);

  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  function handlePressIn() {
    buttonScale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  }
  function handlePressOut() {
    buttonScale.value = withSpring(1.0, { damping: 15, stiffness: 400 });
  }

  const handleSignIn = useCallback(async () => {
    const { setLoading, setError, setNeedsInstall } = useSignInStore.getState();

    setLoading(true);
    setError(null);
    setNeedsInstall(false);

    try {
      const codeVerifier = btoa(
        String.fromCharCode(...Crypto.getRandomBytes(32)),
      )
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      const hexDigest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        codeVerifier,
      );
      const digestBytes = new Uint8Array(hexDigest.length / 2);
      for (let i = 0; i < hexDigest.length; i += 2) {
        digestBytes[i / 2] = parseInt(hexDigest.slice(i, i + 2), 16);
      }
      const codeChallenge = btoa(String.fromCharCode(...digestBytes))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      await savePendingAuth(codeVerifier);

      const authUrl =
        `https://github.com/login/oauth/authorize` +
        `?client_id=${CLIENT_ID}` +
        `&scope=${encodeURIComponent(SCOPES)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&code_challenge=${codeChallenge}` +
        `&code_challenge_method=S256`;

      await Linking.openURL(authUrl);
    } catch {
      setError("Something went wrong. Check your connection and try again.");
      setLoading(false);
      await clearPendingAuth();
    }
  }, [redirectUri]);

  const handleInstall = useCallback(async () => {
    const { setLoading, setError, setNeedsInstall, setPendingToken } =
      useSignInStore.getState();

    setLoading(true);
    setError(null);

    try {
      const installUrl = `https://github.com/apps/${APP_SLUG}/installations/new`;

      const result = await WebBrowser.openAuthSessionAsync(
        installUrl,
        redirectUri,
      );

      if (result.type !== "success") {
        setLoading(false);
        return;
      }

      const { pendingToken, pendingTokenExpiry } = useSignInStore.getState();
      if (
        !pendingToken ||
        (pendingTokenExpiry && Date.now() > pendingTokenExpiry)
      ) {
        setPendingToken(null);
        setLoading(false);
        setNeedsInstall(false);
        return;
      }
      setPendingToken(null);

      githubAxios.defaults.headers.common["Authorization"] =
        `Bearer ${pendingToken}`;

      const [, user] = await Promise.all([
        saveToken(pendingToken),
        fetchAuthenticatedUser(),
      ]);

      const storedPAT = await getStoredPAT();
      if (storedPAT) setPat(storedPAT);

      setToken(pendingToken);
      setUser(user);

      clearAllMMKV();
      queryClient.clear();
      queryClient.setQueryData(queryKeys.user(), user);
      prefetchOverview(queryClient, user.login);

      setLoading(false);
      setNeedsInstall(false);
      router.replace("/(app)/(tabs)/overview" as Href);
    } catch {
      setError("Installation failed. You can set it up later from settings.");
      setLoading(false);
    }
  }, [redirectUri, setUser, router, setToken, setPat]);

  const s = useMemo(
    () => buildStyles(colors, isDark, shadows, insets.top, insets.bottom),
    [colors, isDark, shadows, insets.top, insets.bottom],
  );

  return (
    <View style={s.container}>
      <Animated.View
        entering={FadeInDown.delay(0).duration(400).springify()}
        style={s.logoBlock}
      >
        <View style={s.logoMark}>
          <Image
            source={
              isDark
                ? require("@/assets/images/splash-icon-dark.png")
                : require("@/assets/images/splash-icon.png")
            }
            style={s.logoImage}
            contentFit="contain"
          />
        </View>
        <Text style={s.appName}>Shikai</Text>
        <Text style={s.tagline}>Your GitHub dashboard, at a glance.</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(80).duration(400).springify()}
        style={s.pillRow}
      >
        {["Read-only", "No tracking", "On-device"].map((label) => (
          <View key={label} style={s.pill}>
            <Text style={s.pillText}>{label}</Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(160).duration(400).springify()}
        style={s.ctaBlock}
      >
        {needsInstall ? (
          <>
            <Text style={s.installTitle}>One more step</Text>
            <Text style={s.installDesc}>
              Choose which repositories Shikai can access on GitHub.
            </Text>
            <AnimatedPressable
              style={[s.button, isLoading && s.buttonLoading, buttonStyle]}
              onPress={handleInstall}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.buttonText}>Set up repo access</Text>
              )}
            </AnimatedPressable>
          </>
        ) : (
          <AnimatedPressable
            style={[s.button, isLoading && s.buttonLoading, buttonStyle]}
            onPress={handleSignIn}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Octicons
                  name="mark-github"
                  size={18}
                  color="#fff"
                  style={s.buttonIcon}
                />
                <Text style={s.buttonText}>Sign in with GitHub</Text>
              </>
            )}
          </AnimatedPressable>
        )}

        {error && (
          <Animated.View entering={FadeInDown.duration(200)}>
            <Text style={s.errorText}>{error}</Text>
          </Animated.View>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).duration(400).springify()}>
        <Text style={s.footerNote}>
          Shikai is read-only. It will never modify your GitHub data.
        </Text>
      </Animated.View>
    </View>
  );
}

function buildStyles(
  colors: ColorTokens,
  isDark: boolean,
  shadows: object,
  topInset: number,
  bottomInset: number,
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.lg,
      paddingTop: Math.max(topInset, Spacing.xxl),
      paddingBottom: Math.max(bottomInset, Spacing.xxl),
      gap: Spacing.xl,
    },

    logoBlock: {
      alignItems: "center",
      gap: Spacing.sm,
    },

    logoMark: {
      width: 96,
      height: 96,
      borderRadius: 24,
      backgroundColor: colors.accentSubtle,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      ...shadows,
    },

    logoImage: {
      width: 120,
      height: 120,
    },

    appName: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.display,
      color: colors.textPrimary,
      marginTop: Spacing.xs,
    },

    tagline: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textSecondary,
      textAlign: "center",
    },

    pillRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },

    pill: {
      backgroundColor: colors.accentSubtle,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: isDark ? colors.accentMuted : colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },

    pillText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.accent,
    },

    ctaBlock: {
      width: "100%",
      gap: Spacing.sm,
    },

    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
      borderRadius: Radius.md,
      height: 54,
      gap: Spacing.sm,
    },

    buttonLoading: {
      opacity: 0.85,
    },

    buttonIcon: {
      marginTop: 1,
    },

    buttonText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: "#FFFFFF",
    },

    errorText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.danger,
      textAlign: "center",
      lineHeight: FontSize.caption * 1.5,
    },

    installTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
      textAlign: "center",
    },

    installDesc: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: FontSize.body * 1.5,
      marginBottom: Spacing.xs,
    },

    footerNote: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: FontSize.caption * 1.6,
    },
  });
}
