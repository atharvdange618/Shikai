import { Octicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAlert } from "@/components";
import { clearAllMMKV } from "@/lib/mmkv";
import { deleteToken } from "@/lib/secure-storage";

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
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";

export default function SettingsScreen() {
  const { theme, themeName, setThemeName } = useThemeContext();
  const { colors } = theme;
  const router = useRouter();
  const queryClient = useQueryClient();
  const alert = useAlert();
  const s = useMemo(() => buildStyles(colors), [colors]);

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
            router.replace("/sign-in" as Href);
          },
        },
      ],
    });
  }, [router, alert, queryClient]);

  return (
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
                onPress={() => setThemeName(t.name as ThemeName)}
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
                  <Octicons
                    name="check"
                    size={16}
                    color={colors.accent}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>About</Text>
        <View style={s.card}>
          <Pressable
            style={({ pressed }) => [s.menuRow, pressed && s.menuRowPressed]}
            onPress={() => router.push("/(app)/(tabs)/profile/about" as Href)}
          >
            <Octicons name="info" size={IconSize.md} color={colors.textSecondary} />
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
            <Octicons name="sign-out" size={IconSize.md} color={colors.danger} />
            <Text style={s.dangerText}>Sign out</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
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

    dangerText: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.danger,
    },
  });
}
