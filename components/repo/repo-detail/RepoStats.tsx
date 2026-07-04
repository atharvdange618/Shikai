import { Octicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import {
  FontFamily,
  FontSize,
  Radius,
  Spacing,
  type ColorTokens,
} from "@/constants/theme";
import { formatCount } from "@/lib/utils";

interface RepoStatsProps {
  stars: number;
  forks: number;
  watchers: number;
  commits: number;
  isLoading: boolean;
  isCommitsLoading: boolean;
  colors: ColorTokens;
}

export function RepoStats({
  stars,
  forks,
  watchers,
  commits,
  isLoading,
  isCommitsLoading,
  colors,
}: RepoStatsProps) {
  const s = buildStyles(colors);

  return (
    <View style={s.statsCard}>
      <StatItem
        icon="star"
        value={stars}
        label="Stars"
        colors={colors}
        isLoading={isLoading}
        iconColor={colors.star}
      />
      <View style={s.statDivider} />
      <StatItem
        icon="repo-forked"
        value={forks}
        label="Forks"
        colors={colors}
        isLoading={isLoading}
      />
      <View style={s.statDivider} />
      <StatItem
        icon="eye"
        value={watchers}
        label="Watching"
        colors={colors}
        isLoading={isLoading}
      />
      <View style={s.statDivider} />
      <StatItem
        icon="git-commit"
        value={commits}
        label="Commits"
        colors={colors}
        isLoading={isLoading || isCommitsLoading}
      />
    </View>
  );
}

function StatItem({
  icon,
  value,
  label,
  colors,
  isLoading,
  iconColor,
}: {
  icon: React.ComponentProps<typeof Octicons>["name"];
  value: number;
  label: string;
  colors: ColorTokens;
  isLoading: boolean;
  iconColor?: string;
}) {
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
        <View
          style={{
            width: 40,
            height: 16,
            borderRadius: Radius.sm,
            backgroundColor: colors.surfaceSecondary,
          }}
        />
        <View
          style={{
            width: 30,
            height: 11,
            borderRadius: Radius.sm,
            backgroundColor: colors.surfaceSecondary,
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
      <Octicons
        name={icon}
        size={14}
        color={iconColor ?? colors.textSecondary}
      />
      <Text
        style={{
          fontFamily: FontFamily.semiBold,
          fontSize: FontSize.body,
          color: colors.textPrimary,
          fontVariant: ["tabular-nums"],
        }}
      >
        {formatCount(value)}
      </Text>
      <Text
        style={{
          fontFamily: FontFamily.regular,
          fontSize: FontSize.caption,
          color: colors.textMuted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    statsCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },

    statDivider: {
      width: 1,
      height: 36,
      backgroundColor: colors.border,
    },
  });
}
