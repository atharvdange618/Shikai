import { Tooltip } from "@/components/shared/Tooltip";
import { Octicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";
import type { ContributionStats } from "@/types/github-graphql.types";

interface Props {
  stats: ContributionStats;
}

const STAT_INFO: Record<string, string> = {
  streak:
    "Consecutive days with at least one contribution. A higher streak means more consistent activity.",
  best: "Your longest ever streak of consecutive contribution days.",
  active:
    "The day of the week when you contribute the most, based on your recent activity.",
};

export function ContributionStatsRow({ stats }: Props) {
  const { colors } = useTheme();
  const s = useMemo(() => buildStyles(colors), [colors]);

  const streakProgress =
    stats.longestStreak > 0
      ? Math.min(stats.currentStreak / stats.longestStreak, 1)
      : 0;
  const isStreakActive = stats.currentStreak > 0;

  return (
    <View style={s.row}>
      <View
        style={s.item}
        accessibilityLabel={`${stats.currentStreak} day streak`}
      >
        <Octicons
          name="flame"
          size={16}
          color={isStreakActive ? colors.success : colors.textMuted}
        />
        <Text
          style={[
            s.value,
            s.streakValue,
            isStreakActive && { color: colors.success },
          ]}
        >
          {stats.currentStreak}
        </Text>
        <View style={s.labelRow}>
          <Text style={s.label}>Day streak</Text>
          <Tooltip content={STAT_INFO.streak} align="left">
            <Pressable hitSlop={8}>
              <Octicons name="info" size={10} color={colors.textMuted} />
            </Pressable>
          </Tooltip>
        </View>
        {stats.longestStreak > 0 && (
          <View style={s.progressTrack}>
            <View
              style={[
                s.progressFill,
                {
                  width: `${streakProgress * 100}%`,
                  backgroundColor: isStreakActive
                    ? colors.success
                    : colors.textMuted,
                },
              ]}
            />
          </View>
        )}
      </View>

      <View style={s.divider} />

      <View
        style={s.item}
        accessibilityLabel={`${stats.longestStreak} day best streak`}
      >
        <Octicons name="flame" size={14} color={colors.star} />
        <Text style={s.value}>{stats.longestStreak}</Text>
        <View style={s.labelRow}>
          <Text style={s.label}>Best streak</Text>
          <Tooltip content={STAT_INFO.best} align="center">
            <Pressable hitSlop={8}>
              <Octicons name="info" size={10} color={colors.textMuted} />
            </Pressable>
          </Tooltip>
        </View>
      </View>

      <View style={s.divider} />

      <View
        style={s.item}
        accessibilityLabel={`Most active day: ${stats.mostActiveDay}`}
      >
        <Octicons name="calendar" size={14} color={colors.accent} />
        <Text style={s.value}>{stats.mostActiveDay}</Text>
        <View style={s.labelRow}>
          <Text style={s.label}>Most active</Text>
          <Tooltip content={STAT_INFO.active} align="right">
            <Pressable hitSlop={8}>
              <Octicons name="info" size={10} color={colors.textMuted} />
            </Pressable>
          </Tooltip>
        </View>
      </View>
    </View>
  );
}

function buildStyles(colors: ColorTokens) {
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

    streakValue: {
      fontSize: FontSize.heading,
    },

    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    label: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },

    progressTrack: {
      width: "80%",
      height: 3,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 2,
      marginTop: 4,
      overflow: "hidden",
    },

    progressFill: {
      height: "100%",
      borderRadius: 2,
    },
  });
}
