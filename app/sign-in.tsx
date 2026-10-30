import { Octicons } from "@expo/vector-icons";
import { makeRedirectUri } from "expo-auth-session";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAvoid } from "@/components/shared/KeyboardAvoid";
import {
  FontFamily,
  FontSize,
  IconSize,
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
  hasOwnInstallation,
  validateToken,
} from "@/lib/github-rest";
import type { GitHubUser } from "@/types/github.types";
import { clearAllMMKV } from "@/lib/mmkv";
import { prefetchOverview } from "@/lib/prefetch";
import { queryClient, queryKeys } from "@/lib/query-client";
import { restorePATFor } from "@/lib/session";
import {
  clearPendingAuth,
  getPendingAuth,
  savePendingAuth,
  saveToken,
} from "@/lib/secure-storage";
import { useAuthStore } from "@/stores/auth.store";
import { useSignInStore } from "@/stores/signin.store";
import { requestWidgetUpdate } from "react-native-android-widget";

const CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID!;
const APP_SLUG = process.env.EXPO_PUBLIC_GITHUB_APP_SLUG!;
const OAUTH_PROXY_URL = process.env.EXPO_PUBLIC_OAUTH_PROXY_URL!;
const SCOPES = ["read:user", "user:email", "repo:status", "read:repo"].join(
  ",",
);

// Classic-token scopes that cover every read path in the app.
const NEW_TOKEN_URL =
  "https://github.com/settings/tokens/new?scopes=repo,read:user&description=Shikai";

const FEATURES: {
  icon: ComponentProps<typeof Octicons>["name"];
  text: string;
}[] = [
  { icon: "repo", text: "Repos, pull requests and issues in one place" },
  { icon: "graph", text: "Your contribution graph as a home screen widget" },
  { icon: "bell", text: "Optional alerts for review requests and mentions" },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SignInScreen() {
  const { colors, isDark } = useTheme();
  const shadows = useMemo(() => (isDark ? {} : Shadows.light.md), [isDark]);
  const insets = useSafeAreaInsets();

  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const setPat = useAuthStore((s) => s.setPat);

  const isLoading = useSignInStore((s) => s.isLoading);
  const error = useSignInStore((s) => s.error);
  const needsInstall = useSignInStore((s) => s.needsInstall);

  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      useSignInStore.getState().reset();
    };
  }, []);

  const redirectUri = makeRedirectUri({ scheme: "shikai" });

  // Shared tail for every sign-in path: persist the token, restore any stored
  // PAT, seed the caches, and refresh the widget.
  const finalizeSession = useCallback(
    async (accessToken: string, user: GitHubUser) => {
      await saveToken(accessToken);

      const storedPAT = await restorePATFor(user.login);
      if (storedPAT) setPat(storedPAT);

      setToken(accessToken);
      setUser(user);

      clearAllMMKV();
      queryClient.clear();
      queryClient.setQueryData(queryKeys.user(), user);
      prefetchOverview(queryClient, user.login);
      requestWidgetUpdate({
        widgetName: "ContributionGraph",
        renderWidget: async () => {
          const { fetchContributionsForWidget } = await import(
            "@/lib/widget-data"
          );
          const { ContributionWidget } = await import(
            "@/widgets/ContributionWidget"
          );
          const data = await fetchContributionsForWidget();
          if (data) {
            return (
              <ContributionWidget
                totalContributions={data.totalContributions}
                weeks={data.weeks}
                currentStreak={data.currentStreak}
                longestStreak={data.longestStreak}
              />
            );
          }
          return (
            <ContributionWidget
              totalContributions={0}
              weeks={[]}
              currentStreak={0}
              longestStreak={0}
            />
          );
        },
      });
    },
    [setToken, setUser, setPat],
  );

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

        const [installations, user] = await Promise.all([
          fetchUserInstallations(),
          fetchAuthenticatedUser(),
        ]);

        if (!hasOwnInstallation(installations, user.login)) {
          setPendingToken(accessToken);
          setLoading(false);
          setNeedsInstall(true);
          return;
        }

        await finalizeSession(accessToken, user);

        setLoading(false);
      } catch {
        setError("Something went wrong. Check your connection and try again.");
        setLoading(false);
        await clearPendingAuth();
      }
    },
    [redirectUri, finalizeSession],
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

      const storedPAT = await restorePATFor(user.login);
      if (storedPAT) setPat(storedPAT);

      setToken(pendingToken);
      setUser(user);

      clearAllMMKV();
      queryClient.clear();
      queryClient.setQueryData(queryKeys.user(), user);
      prefetchOverview(queryClient, user.login);

      setLoading(false);
      setNeedsInstall(false);
    } catch {
      setError("Installation failed. You can set it up later from settings.");
      setLoading(false);
    }
  }, [redirectUri, setUser, setToken, setPat]);

  // For users who only need repos from accounts that already have the app,
  // like an org. Settings and the Repos tab still link to the install page.
  const handleSkipInstall = useCallback(async () => {
    const {
      setLoading,
      setError,
      setNeedsInstall,
      setPendingToken,
      pendingToken,
      pendingTokenExpiry,
    } = useSignInStore.getState();

    setPendingToken(null);
    setNeedsInstall(false);
    if (
      !pendingToken ||
      (pendingTokenExpiry && Date.now() > pendingTokenExpiry)
    ) {
      return;
    }

    setLoading(true);
    try {
      const user = await fetchAuthenticatedUser();
      await finalizeSession(pendingToken, user);
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    }
    setLoading(false);
  }, [finalizeSession]);

  // Self-contained sign-in for anyone who would rather paste a token than run
  // the browser OAuth flow. A classic or fine-grained PAT with repo and
  // read:user scopes covers every read path in the app.
  const handleTokenSignIn = useCallback(async () => {
    const trimmed = tokenInput.trim();
    if (!trimmed.startsWith("ghp_") && !trimmed.startsWith("github_pat_")) {
      setTokenError("Token must start with ghp_ or github_pat_");
      return;
    }

    setTokenLoading(true);
    setTokenError(null);

    try {
      const user = await validateToken(trimmed);
      await finalizeSession(trimmed, user);
      setTokenInput("");
    } catch {
      setTokenError(
        "That token didn't work. Check it has the repo and read:user scopes.",
      );
      setTokenLoading(false);
    }
  }, [tokenInput, finalizeSession]);

  const s = useMemo(
    () => buildStyles(colors, isDark, shadows, insets.top, insets.bottom),
    [colors, isDark, shadows, insets.top, insets.bottom],
  );

  return (
    <KeyboardAvoid>
      <View style={s.container}>
        <View style={s.intro}>
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

          {/* Hidden in token mode: the keyboard leaves no room for it, and
            someone pasting a token has already decided to sign in. */}
          {!showTokenInput && (
            <Animated.View
              entering={FadeInDown.delay(80).duration(400).springify()}
              style={s.featureList}
            >
              {FEATURES.map((feature) => (
                <View key={feature.text} style={s.featureRow}>
                  <View style={s.featureIcon}>
                    <Octicons
                      name={feature.icon}
                      size={IconSize.sm}
                      color={colors.accent}
                    />
                  </View>
                  <Text style={s.featureText}>{feature.text}</Text>
                </View>
              ))}
            </Animated.View>
          )}
        </View>

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
                  <ActivityIndicator color={colors.textOnAccent} size="small" />
                ) : (
                  <Text style={s.buttonText}>Set up repo access</Text>
                )}
              </AnimatedPressable>
              <Pressable onPress={handleSkipInstall} disabled={isLoading}>
                <Text style={s.secondaryLink}>Skip for now</Text>
              </Pressable>
            </>
          ) : showTokenInput ? (
            <>
              <Text style={s.tokenHint}>
                The token needs the <Text style={s.bold}>repo</Text> and{" "}
                <Text style={s.bold}>read:user</Text> scopes.{" "}
                <Text
                  style={s.link}
                  onPress={() => Linking.openURL(NEW_TOKEN_URL)}
                >
                  Create a token
                </Text>
              </Text>
              <TextInput
                style={s.tokenInput}
                value={tokenInput}
                onChangeText={(text) => {
                  setTokenInput(text);
                  setTokenError(null);
                }}
                placeholder="ghp_… or github_pat_…"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                editable={!tokenLoading}
              />
              <AnimatedPressable
                style={[
                  s.button,
                  tokenLoading && s.buttonLoading,
                  !tokenLoading && !tokenInput.trim() && s.buttonDisabled,
                  buttonStyle,
                ]}
                onPress={handleTokenSignIn}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={tokenLoading || !tokenInput.trim()}
              >
                {tokenLoading ? (
                  <ActivityIndicator color={colors.textOnAccent} size="small" />
                ) : (
                  <Text style={s.buttonText}>Continue</Text>
                )}
              </AnimatedPressable>
              <Pressable
                onPress={() => {
                  setShowTokenInput(false);
                  setTokenInput("");
                  setTokenError(null);
                }}
                disabled={tokenLoading}
              >
                <Text style={s.secondaryLink}>Back to GitHub sign in</Text>
              </Pressable>
              {tokenError && (
                <Animated.View entering={FadeInDown.duration(200)}>
                  <Text style={s.errorText}>{tokenError}</Text>
                </Animated.View>
              )}
            </>
          ) : (
            <>
              <AnimatedPressable
                style={[s.button, isLoading && s.buttonLoading, buttonStyle]}
                onPress={handleSignIn}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.textOnAccent} size="small" />
                ) : (
                  <>
                    <Octicons
                      name="mark-github"
                      size={18}
                      color={colors.textOnAccent}
                      style={s.buttonIcon}
                    />
                    <Text style={s.buttonText}>Sign in with GitHub</Text>
                  </>
                )}
              </AnimatedPressable>
              <Pressable
                onPress={() => setShowTokenInput(true)}
                disabled={isLoading}
              >
                <Text style={s.secondaryLink}>Sign in with a token</Text>
              </Pressable>
            </>
          )}

          {error && !showTokenInput && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <Text style={s.errorText}>{error}</Text>
            </Animated.View>
          )}

          <Text style={s.footerNote}>
            Read-only. Shikai never changes your GitHub data.
          </Text>
        </Animated.View>
      </View>
    </KeyboardAvoid>
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
      paddingHorizontal: Spacing.lg,
      paddingTop: Math.max(topInset, Spacing.xxl),
      paddingBottom: Math.max(bottomInset, Spacing.lg),
      gap: Spacing.xl,
    },

    // Takes the space above the actions, so the buttons sit at the bottom
    // within thumb reach.
    intro: {
      flex: 1,
      justifyContent: "center",
      gap: Spacing.xxl,
      overflow: "hidden",
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

    featureList: {
      gap: Spacing.md,
      paddingHorizontal: Spacing.sm,
    },

    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },

    featureIcon: {
      width: 32,
      height: 32,
      borderRadius: Radius.md,
      backgroundColor: colors.accentSubtle,
      borderWidth: 1,
      borderColor: isDark ? colors.accentMuted : colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    featureText: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textSecondary,
    },

    tokenHint: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      lineHeight: FontSize.caption * 1.5,
    },

    bold: {
      fontFamily: FontFamily.semiBold,
    },

    link: {
      fontFamily: FontFamily.medium,
      color: colors.textLink,
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

    buttonDisabled: {
      opacity: 0.5,
    },

    tokenInput: {
      width: "100%",
      height: 54,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textPrimary,
      backgroundColor: colors.surfaceInset,
    },

    secondaryLink: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.accent,
      textAlign: "center",
      paddingVertical: Spacing.sm,
    },

    buttonIcon: {
      marginTop: 1,
    },

    buttonText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textOnAccent,
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
