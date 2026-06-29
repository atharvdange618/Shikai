import { Octicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { FontFamily, FontSize, Radius, Spacing } from "@/constants/theme";
import {
  themeList,
  type ColorTokens,
  type ThemeName,
} from "@/constants/themes";
import { useThemeContext } from "@/contexts/ThemeContext";

export default function SettingsScreen() {
  const { theme, themeName, setThemeName } = useThemeContext();
  const s = useMemo(() => buildStyles(theme.colors), [theme.colors]);

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
                    color={theme.colors.accent}
                  />
                )}
              </Pressable>
            );
          })}
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
  });
}
