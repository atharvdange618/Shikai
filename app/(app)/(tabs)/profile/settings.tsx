import { Octicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Href, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAlert } from "@/components";
import { KeyboardAvoid } from "@/components/shared/KeyboardAvoid";
import { rateLimit } from "@/lib/axios";
import { validatePAT } from "@/lib/github-rest";
import { clearAllMMKV } from "@/lib/mmkv";
import { deletePAT, deleteToken, savePAT } from "@/lib/secure-storage";
import { format24HourTime } from "@/lib/utils";

import {
  FontFamily,
  FontSize,
  IconSize,
  Radius,
  Spacing,
} from "@/constants/theme";
import {
  themeList,
  type ColorTokens,
  type ThemeName,
} from "@/constants/themes";
import { useThemeContext } from "@/contexts/ThemeContext";
import { refreshWidgetTheme } from "@/lib/widget-refresh";
import { useAuthStore } from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsScreen() {
  const { theme, themeName, setThemeName } = useThemeContext();
  const { colors } = theme;
  const router = useRouter();
  const queryClient = useQueryClient();
  const alert = useAlert();
  const s = useMemo(() => buildStyles(colors), [colors]);

  const pat = useAuthStore((s) => s.pat);
  const setPat = useAuthStore((s) => s.setPat);
  const [patInput, setPatInput] = useState("");
  const [validating, setValidating] = useState(false);
  const [patError, setPatError] = useState<string | null>(null);

  // rateLimit is a plain mutable object updated by the axios interceptor,
  // not reactive state, so snapshot it fresh each time this screen is
  // focused rather than trying to subscribe to it.
  const [rateLimitSnapshot, setRateLimitSnapshot] = useState(() => ({
    ...rateLimit,
  }));

  useFocusEffect(
    useCallback(() => {
      setRateLimitSnapshot({ ...rateLimit });
    }, []),
  );

  const handleSavePAT = useCallback(async () => {
    const trimmed = patInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith("ghp_") && !trimmed.startsWith("github_pat_")) {
      setPatError("Token must start with ghp_ or github_pat_");
      return;
    }

    setValidating(true);
    setPatError(null);

    try {
      const valid = await validatePAT(trimmed);
      setValidating(false);

      if (!valid) {
        setPatError(
          "Invalid token. Make sure it has the 'notifications' scope.",
        );
        return;
      }

      await savePAT(trimmed);
      setPat(trimmed);
      setPatInput("");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      setValidating(false);
      setPatError("Something went wrong. Please try again.");
    }
  }, [patInput, setPat, queryClient]);

  const handleRemovePAT = useCallback(() => {
    alert.show({
      variant: "danger",
      title: "Remove token",
      message:
        "Notifications will stop working without a Personal Access Token.",
      actions: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await deletePAT();
            setPat(null);
            setPatInput("");
            setPatError(null);
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          },
        },
      ],
    });
  }, [alert, setPat, queryClient]);

  const handleClearCache = useCallback(() => {
    clearAllMMKV();
    queryClient.clear();
    alert.show({
      variant: "success",
      title: "Cache cleared",
      message: "Data will be refetched as you use the app.",
    });
  }, [alert, queryClient]);

  const handleSignOut = useCallback(() => {
    alert.show({
      variant: "danger",
      title: "Sign out",
      message: "Are you sure you want to sign out?",
      actions: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            await deleteToken();
            useAuthStore.getState().clearAuth();
            queryClient.clear();
            clearAllMMKV();
          },
        },
      ],
    });
  }, [alert, queryClient]);

  return (
    <KeyboardAvoid>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
      <View style={s.section}>
        <Text style={s.sectionTitle}>Appearance</Text>
        <View style={s.card}>
          {themeList.map((t, i) => {
            const isActive = t.name === themeName;
            const isLast = i === themeList.length - 1;

            return (
              <Pressable
                key={t.name}
                style={({ pressed }) => [
                  s.themeRow,
                  !isLast && s.themeRowBorder,
                  pressed && s.themeRowPressed,
                ]}
                onPress={() => {
                  setThemeName(t.name as ThemeName);
                  refreshWidgetTheme(t.name as ThemeName).catch(() => {});
                }}
              >
                <View style={s.themeInfo}>
                  <View style={s.themeDots}>
                    <View
                      style={[s.dot, { backgroundColor: t.colors.background }]}
                    />
                    <View
                      style={[s.dot, { backgroundColor: t.colors.accent }]}
                    />
                    <View
                      style={[s.dot, { backgroundColor: t.colors.textPrimary }]}
                    />
                  </View>
                  <Text style={[s.themeLabel, isActive && s.themeLabelActive]}>
                    {t.label}
                  </Text>
                </View>
                {isActive && (
                  <Octicons name="check" size={16} color={colors.accent} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Notifications & Following</Text>
        <View style={s.card}>
          <View style={s.patInfo}>
            <Text style={s.patDescription}>
              A Personal Access Token enables the Notifications tab and the
              Following activity feed. Without one, these features are hidden.
            </Text>
            <Pressable
              onPress={() =>
                Linking.openURL(
                  "https://github.com/settings/tokens/new?scopes=notifications,repo&description=Shikai%20Notifications",
                )
              }
            >
              <Text style={s.patLink}>Create a token here</Text>
            </Pressable>
            <Text style={s.patDescription}>
              with the <Text style={s.patBold}>notifications</Text> and{" "}
              <Text style={s.patBold}>repo</Text> scopes, then paste it below.
            </Text>
          </View>

          {pat ? (
            <View style={s.patActiveRow}>
              <View style={s.patActiveInfo}>
                <View style={[s.patDot, { backgroundColor: colors.success }]} />
                <Text style={s.patActiveText}>Token configured</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  s.patRemoveBtn,
                  pressed && s.menuRowPressed,
                ]}
                onPress={handleRemovePAT}
              >
                <Text style={s.patRemoveText}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.patInputContainer}>
              <TextInput
                style={s.patInput}
                value={patInput}
                onChangeText={(text) => {
                  setPatInput(text);
                  setPatError(null);
                }}
                placeholder="ghp_xxxx or github_pat_xxxx"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
              {patError && (
                <Text style={[s.patError, { color: colors.danger }]}>
                  {patError}
                </Text>
              )}
              <Pressable
                style={({ pressed }) => [
                  s.patSaveBtn,
                  { backgroundColor: colors.accent },
                  (pressed || validating) && s.menuRowPressed,
                ]}
                onPress={handleSavePAT}
                disabled={validating || !patInput.trim()}
              >
                {validating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.patSaveBtnText}>Save</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Data & Storage</Text>
        <View style={s.card}>
          <View style={s.menuRow}>
            <Octicons
              name="graph"
              size={IconSize.md}
              color={colors.textSecondary}
            />
            <View style={s.rateLimitInfo}>
              <Text style={s.menuText}>API rate limit</Text>
              <Text style={s.rateLimitDetail}>
                {rateLimitSnapshot.remaining !== null &&
                rateLimitSnapshot.limit !== null
                  ? `${rateLimitSnapshot.remaining} / ${rateLimitSnapshot.limit} requests remaining` +
                    (rateLimitSnapshot.reset
                      ? `, resets at ${format24HourTime(rateLimitSnapshot.reset.toISOString())}`
                      : "")
                  : "No API activity yet this session"}
              </Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              s.menuRow,
              s.rateLimitDivider,
              pressed && s.menuRowPressed,
            ]}
            onPress={handleClearCache}
          >
            <Octicons
              name="trash"
              size={IconSize.md}
              color={colors.textSecondary}
            />
            <Text style={s.menuText}>Clear cache</Text>
          </Pressable>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>About</Text>
        <View style={s.card}>
          <Pressable
            style={({ pressed }) => [s.menuRow, pressed && s.menuRowPressed]}
            onPress={() => router.push("/(app)/(tabs)/profile/about" as Href)}
          >
            <Octicons
              name="info"
              size={IconSize.md}
              color={colors.textSecondary}
            />
            <Text style={s.menuText}>About Shikai</Text>
            <Octicons name="chevron-right" size={13} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Account</Text>
        <View style={s.dangerCard}>
          <Pressable
            style={({ pressed }) => [
              s.menuRow,
              s.dangerRow,
              pressed && s.menuRowPressed,
            ]}
            onPress={handleSignOut}
          >
            <Octicons
              name="sign-out"
              size={IconSize.md}
              color={colors.danger}
            />
            <Text style={s.dangerText}>Sign out</Text>
          </Pressable>
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoid>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xxl,
      gap: Spacing.xl,
    },

    section: {
      gap: Spacing.sm,
    },

    sectionTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.label,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: Spacing.xs,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },

    dangerCard: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.dangerSubtle,
      overflow: "hidden",
    },

    themeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },

    themeRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    themeRowPressed: {
      opacity: 0.6,
    },

    themeInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },

    themeDots: {
      flexDirection: "row",
      gap: 4,
    },

    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.1)",
    },

    themeLabel: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textSecondary,
    },

    themeLabelActive: {
      color: colors.textPrimary,
      fontFamily: FontFamily.semiBold,
    },

    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },

    menuRowPressed: {
      opacity: 0.6,
    },

    menuText: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textSecondary,
    },

    dangerRow: {
      gap: Spacing.md,
    },

    rateLimitInfo: {
      flex: 1,
      gap: 2,
    },

    rateLimitDetail: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },

    rateLimitDivider: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    dangerText: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.danger,
    },

    patInfo: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      gap: 2,
    },

    patDescription: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      lineHeight: FontSize.caption * 1.5,
    },

    patLink: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.accent,
      textDecorationLine: "underline",
    },

    patBold: {
      fontFamily: FontFamily.semiBold,
    },

    patActiveRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    patActiveInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },

    patDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    patActiveText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textSecondary,
    },

    patRemoveBtn: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.sm,
    },

    patRemoveText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.danger,
    },

    patInputContainer: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    patInput: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize.label,
      color: colors.textPrimary,
      backgroundColor: colors.surfaceInset,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },

    patError: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
    },

    patSaveBtn: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: Radius.sm,
      paddingVertical: Spacing.sm,
    },

    patSaveBtnText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.label,
      color: "#fff",
    },
  });
}
