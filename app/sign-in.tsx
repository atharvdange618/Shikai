import { Octicons } from "@expo/vector-icons";
import { makeRedirectUri } from "expo-auth-session";
import * as Linking from "expo-linking";
import { Href, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
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
import { fetchAuthenticatedUser } from "@/lib/github-rest";
import { saveToken } from "@/lib/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

const CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID!;
const CLIENT_SECRET = process.env.EXPO_PUBLIC_GITHUB_CLIENT_SECRET!;
const SCOPES = ["read:user", "user:email", "repo"].join(",");

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

  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setLoading(true);
    setError(null);

    try {
      const authUrl =
        `https://github.com/login/oauth/authorize` +
        `?client_id=${CLIENT_ID}` +
        `&scope=${encodeURIComponent(SCOPES)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
      );

      if (result.type !== "success") {
        return;
      }

      const parsed = Linking.parse(result.url);
      const code = parsed.queryParams?.code as string | undefined;

      if (!code) {
        setError("Authorization failed. Please try again.");
        return;
      }

      const tokenResponse = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            redirect_uri: redirectUri,
          }),
        },
      );

      const tokenData = await tokenResponse.json();

      if (tokenData.error || !tokenData.access_token) {
        setError("Could not get access token. Please try again.");
        return;
      }

      const accessToken: string = tokenData.access_token;

      setToken(accessToken);

      setLoading(false);

      router.replace("/(app)/(tabs)" as Href);

      Promise.all([
        saveToken(accessToken),
        fetchAuthenticatedUser(),
      ])
        .then(([, user]) => setUser(user))
        .catch(() => {
          useAuthStore.getState().clearAuth();
        });
    } catch (err) {
      if (__DEV__) {
        console.error("[GitHub OAuth Error]", err);
      }
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [redirectUri, setToken, setUser, router]);

  const s = buildStyles(colors, isDark, shadows, insets.top, insets.bottom);

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

    footerNote: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: FontSize.caption * 1.6,
    },
  });
}
