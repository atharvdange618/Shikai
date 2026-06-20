import { Octicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

import {
  DarkColors,
  FontFamily,
  FontSize,
  LightColors,
  Radius,
  Spacing,
} from "@/constants/theme";
import type { ContributionStats } from "@/types/github-graphql.types";

interface Props {
  stats: ContributionStats;
}

export function ContributionStatsRow({ stats }: Props) {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const s = useMemo(() => buildStyles(colors), [colors]);

  return (
    <View style={s.row}>
      <View style={s.item} accessibilityLabel={`${stats.currentStreak} day streak`}>
        <Octicons name="flame" size={14} color={colors.success} />
        <Text style={s.value}>{stats.currentStreak}</Text>
        <Text style={s.label}>Day streak</Text>
      </View>

      <View style={s.divider} />

      <View style={s.item} accessibilityLabel={`${stats.longestStreak} day best streak`}>
        <Octicons name="flame" size={14} color={colors.star} />
        <Text style={s.value}>{stats.longestStreak}</Text>
        <Text style={s.label}>Best streak</Text>
      </View>

      <View style={s.divider} />

      <View style={s.item} accessibilityLabel={`Most active day: ${stats.mostActiveDay}`}>
        <Octicons name="calendar" size={14} color={colors.accent} />
        <Text style={s.value}>{stats.mostActiveDay}</Text>
        <Text style={s.label}>Most active</Text>
      </View>
    </View>
  );
}

function buildStyles(colors: typeof LightColors | typeof DarkColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
    },
    item: {
      flex: 1,
      alignItems: "center",
      gap: 2,
    },
    divider: {
      width: 1,
      height: 28,
      backgroundColor: colors.border,
    },
    value: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
      fontVariant: ["tabular-nums"],
    },
    label: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },
  });
}
