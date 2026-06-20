import { Octicons } from "@expo/vector-icons";
import { makeRedirectUri } from "expo-auth-session";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import { Href, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DarkColors,
  FontFamily,
  FontSize,
  LightColors,
  Radius,
  Shadows,
  Spacing,
} from "@/constants/theme";
import {
  fetchAuthenticatedUser,
  fetchUserInstallations,
} from "@/lib/github-rest";
import { saveToken } from "@/lib/secure-storage";
import { useAuthStore } from "@/stores/auth.store";
import { useSignInStore } from "@/stores/signin.store";

const CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID!;
const APP_SLUG = process.env.EXPO_PUBLIC_GITHUB_APP_SLUG!;
const OAUTH_PROXY_URL = process.env.EXPO_PUBLIC_OAUTH_PROXY_URL!;
const SCOPES = ["read:user", "user:email", "repo:status", "read:repo"].join(",");

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SignInScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const shadows = isDark ? {} : Shadows.light.md;
  const insets = useSafeAreaInsets();

  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  const isLoading = useSignInStore((s) => s.isLoading);
  const error = useSignInStore((s) => s.error);
  const needsInstall = useSignInStore((s) => s.needsInstall);

  useEffect(() => {
    return () => {
      useSignInStore.getState().reset();
    };
  }, []);

  const redirectUri = makeRedirectUri({ scheme: "shikai" });

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
    const { setLoading, setError, setNeedsInstall, setPendingToken } =
      useSignInStore.getState();

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

      const authUrl =
        `https://github.com/login/oauth/authorize` +
        `?client_id=${CLIENT_ID}` +
        `&scope=${encodeURIComponent(SCOPES)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&code_challenge=${codeChallenge}` +
        `&code_challenge_method=S256`;

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
      );

      if (result.type !== "success") {
        setLoading(false);
        return;
      }

      const parsed = Linking.parse(result.url);
      const code = parsed.queryParams?.code as string | undefined;

      if (!code) {
        setError("Authorization failed. Please try again.");
        setLoading(false);
        return;
      }

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
          return;
        }

        accessToken = tokenData.access_token;
      } finally {
        clearTimeout(timeoutId);
      }

      setToken(accessToken);
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
      setUser(user);

      setLoading(false);
      router.replace("/(app)/(tabs)" as Href);
    } catch {
      setError("Something went wrong. Check your connection and try again.");
      setLoading(false);
    }
  }, [redirectUri, setToken, setUser, router]);

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
      if (!pendingToken || (pendingTokenExpiry && Date.now() > pendingTokenExpiry)) {
        setPendingToken(null);
        setLoading(false);
        setNeedsInstall(false);
        return;
      }
      setPendingToken(null);

      setToken(pendingToken);

      const [, user] = await Promise.all([
        saveToken(pendingToken),
        fetchAuthenticatedUser(),
      ]);
      setUser(user);

      setLoading(false);
      setNeedsInstall(false);
      router.replace("/(app)/(tabs)" as Href);
    } catch {
      setError("Installation failed. You can set it up later from settings.");
      setLoading(false);
    }
  }, [redirectUri, setUser, router, setToken]);

  const s = useMemo(() => buildStyles(colors, isDark, shadows, insets.top, insets.bottom), [colors, isDark, shadows, insets.top, insets.bottom]);

  return (
    <View style={s.container}>
      <Animated.View
        entering={FadeInDown.delay(0).duration(400).springify()}
        style={s.logoBlock}
      >
        <View style={s.logoMark}>
          <Octicons name="mark-github" size={40} color={colors.accent} />
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
  colors: typeof LightColors | typeof DarkColors,
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
      width: 80,
      height: 80,
      borderRadius: 22,
      backgroundColor: colors.accentSubtle,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows,
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
