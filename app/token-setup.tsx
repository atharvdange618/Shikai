import { Octicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import {
  DarkColors,
  FontFamily,
  FontSize,
  LightColors,
  Radius,
  Shadows,
  Spacing,
} from "@/constants/theme";
import { validateToken } from "@/lib/github-rest";
import { saveToken } from "@/lib/secure-storage";
import { useAuthStore } from "@/stores/auth.store";

const GITHUB_TOKEN_URL =
  "https://github.com/settings/tokens/new?scopes=read:user,repo&description=Shikai";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function TokenSetupScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const shadows = isDark ? {} : Shadows.light.md;

  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [token, setTokenInput] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [obscure, setObscure] = useState(true);

  const buttonScale = useSharedValue(1);
  const inputShakeX = useSharedValue(0);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const inputShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: inputShakeX.value }],
  }));

  function handlePressIn() {
    buttonScale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  }
  function handlePressOut() {
    buttonScale.value = withSpring(1.0, { damping: 15, stiffness: 400 });
  }

  function shakeInput() {
    inputShakeX.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(-3, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  }

  async function handleConnect() {
    const trimmed = token.trim();

    if (!trimmed) {
      setError("Paste your GitHub token here first.");
      shakeInput();
      return;
    }

    if (!trimmed.startsWith("ghp_") && !trimmed.startsWith("github_pat_")) {
      setError(
        "This doesn't look like a GitHub token. It should start with ghp_ or github_pat_",
      );
      shakeInput();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await validateToken(trimmed);

      await saveToken(trimmed);
      setToken(trimmed);
      setUser(user);

      router.replace("/(app)/(tabs)" as Href);
    } catch (err: unknown) {
      const isAuthError =
        err instanceof Error && err.message.toLowerCase().includes("401");

      setError(
        isAuthError
          ? "Token is invalid or has been revoked. Double-check it and try again."
          : "Could not reach GitHub. Check your connection and try again.",
      );
      shakeInput();
    } finally {
      setLoading(false);
    }
  }

  const s = buildStyles(colors, isDark, shadows);

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(0).duration(400).springify()}
          style={s.logoBlock}
        >
          <View style={s.logoMark}>
            <Octicons name="mark-github" size={36} color={colors.accent} />
          </View>
          <Text style={s.appName}>Shikai</Text>
          <Text style={s.tagline}>Your GitHub dashboard, at a glance.</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(400).springify()}
          style={[s.card, s.infoCard]}
        >
          <View style={s.infoRow}>
            <Octicons
              name="key"
              size={16}
              color={colors.accent}
              style={s.infoIcon}
            />
            <Text style={s.infoText}>
              Shikai reads your GitHub data directly using a Personal Access
              Token. Nothing is stored on any server - the token lives only on
              your device.
            </Text>
          </View>

          <View style={s.divider} />

          <Text style={s.scopesLabel}>
            Grant these scopes when creating the token:
          </Text>

          <View style={s.scopeRow}>
            <View style={s.scopeBadge}>
              <Text style={s.scopeText}>read:user</Text>
            </View>
            <Text style={s.scopeDesc}>Profile, followers, activity</Text>
          </View>

          <View style={s.scopeRow}>
            <View style={s.scopeBadge}>
              <Text style={s.scopeText}>repo</Text>
            </View>
            <Text style={s.scopeDesc}>Repositories (including private)</Text>
          </View>

          <Pressable
            onPress={() => Linking.openURL(GITHUB_TOKEN_URL)}
            style={({ pressed }) => [s.linkRow, pressed && s.linkRowPressed]}
            hitSlop={8}
          >
            <Octicons name="link-external" size={13} color={colors.accent} />
            <Text style={s.linkText}>Generate a token on GitHub</Text>
          </Pressable>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(160).duration(400).springify()}
        >
          <Text style={s.inputLabel}>Personal Access Token</Text>

          <Animated.View
            style={[
              s.inputWrapper,
              inputShakeStyle,
              error && s.inputWrapperError,
            ]}
          >
            <Octicons
              name="lock"
              size={16}
              color={error ? colors.danger : colors.textMuted}
              style={s.inputIcon}
            />
            <TextInput
              style={s.input}
              value={token}
              onChangeText={(t) => {
                setTokenInput(t);
                setError(null);
              }}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={obscure}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
              returnKeyType="go"
              onSubmitEditing={handleConnect}
              editable={!isLoading}
            />
            <Pressable
              onPress={() => setObscure((v) => !v)}
              hitSlop={12}
              style={s.eyeButton}
            >
              <Octicons
                name={obscure ? "eye" : "eye-closed"}
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
          </Animated.View>

          {error && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <Text style={s.errorText}>{error}</Text>
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(240).duration(400).springify()}
          style={s.buttonWrapper}
        >
          <AnimatedPressable
            style={[s.button, isLoading && s.buttonLoading, buttonStyle]}
            onPress={handleConnect}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Octicons
                  name="plug"
                  size={16}
                  color="#fff"
                  style={s.buttonIcon}
                />
                <Text style={s.buttonText}>Connect</Text>
              </>
            )}
          </AnimatedPressable>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(320).duration(400).springify()}
        >
          <Text style={s.footerNote}>
            Shikai is read-only. It will never modify your GitHub data.
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function buildStyles(
  colors: typeof LightColors | typeof DarkColors,
  isDark: boolean,
  shadows: object,
) {
  return StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: colors.background,
    },

    scroll: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xxl,
      gap: Spacing.xl,
    },

    logoBlock: {
      alignItems: "center",
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },

    logoMark: {
      width: 72,
      height: 72,
      borderRadius: 20,
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
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      ...shadows,
    },

    infoCard: {
      gap: Spacing.md,
    },

    infoRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },

    infoIcon: {
      marginTop: 2,
    },

    infoText: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textSecondary,
      lineHeight: FontSize.label * 1.6,
    },

    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: Spacing.xs,
    },

    scopesLabel: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textSecondary,
    },

    scopeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },

    scopeBadge: {
      backgroundColor: colors.accentSubtle,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: isDark ? colors.accentMuted : colors.border,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
    },

    scopeText: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize.caption,
      color: colors.accent,
    },

    scopeDesc: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textSecondary,
    },

    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      paddingVertical: Spacing.xs,
      marginTop: Spacing.xs,
    },

    linkRowPressed: {
      opacity: 0.6,
    },

    linkText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.accent,
    },

    inputLabel: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },

    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      height: 52,
    },

    inputWrapperError: {
      borderColor: colors.danger,
      borderWidth: 1.5,
    },

    inputIcon: {
      marginRight: Spacing.sm,
    },

    input: {
      flex: 1,
      fontFamily: FontFamily.mono,
      fontSize: FontSize.label,
      color: colors.textPrimary,
      paddingVertical: 0,
    },

    eyeButton: {
      padding: Spacing.xs,
      marginLeft: Spacing.xs,
      minWidth: 40,
      minHeight: 40,
      alignItems: "center",
      justifyContent: "center",
    },

    errorText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.danger,
      marginTop: Spacing.sm,
      lineHeight: FontSize.caption * 1.5,
    },

    buttonWrapper: {
      marginTop: Spacing.xs,
    },

    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
      borderRadius: Radius.md,
      height: 52,
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

    footerNote: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: FontSize.caption * 1.6,
    },
  });
}
