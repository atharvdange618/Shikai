import { StyleSheet, Text, useColorScheme, View } from "react-native";

import {
  DarkColors,
  FontFamily,
  FontSize,
  LightColors,
  Radius,
  Spacing,
} from "@/constants/theme";
import type { LanguageShare } from "@/types/github.types";

const MAX_SHOWN = 5;
const BAR_HEIGHT = 8;

interface LanguageBarProps {
  languages: LanguageShare[];
  isLoading?: boolean;
}

export function LanguageBar({
  languages,
  isLoading = false,
}: LanguageBarProps) {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const s = buildStyles(colors);

  if (isLoading) {
    return (
      <View style={s.container}>
        <View style={s.barSkeleton} />
        <View style={s.legendSkeleton} />
      </View>
    );
  }

  if (!languages.length) return null;

  const shown = languages.slice(0, MAX_SHOWN);
  const otherPct = languages
    .slice(MAX_SHOWN)
    .reduce((sum, l) => sum + l.percentage, 0);

  const segments: { name: string; percentage: number; color: string }[] = [
    ...shown,
    ...(otherPct > 0
      ? [{ name: "Other", percentage: otherPct, color: colors.border }]
      : []),
  ];

  return (
    <View style={s.container}>
      <View style={s.bar}>
        {segments.map((seg, i) => (
          <View
            key={seg.name}
            style={{
              flex: seg.percentage,
              height: BAR_HEIGHT,
              backgroundColor: seg.color,
              borderTopLeftRadius: i === 0 ? Radius.full : 0,
              borderBottomLeftRadius: i === 0 ? Radius.full : 0,
              borderTopRightRadius: i === segments.length - 1 ? Radius.full : 0,
              borderBottomRightRadius:
                i === segments.length - 1 ? Radius.full : 0,
            }}
          />
        ))}
      </View>

      <View style={s.legend}>
        {segments.map((seg) => (
          <View key={seg.name} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: seg.color }]} />
            <Text style={s.legendName}>{seg.name}</Text>
            <Text style={s.legendPct}>{seg.percentage.toFixed(1)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function buildStyles(colors: typeof LightColors | typeof DarkColors) {
  return StyleSheet.create({
    container: {
      gap: Spacing.sm,
    },

    bar: {
      flexDirection: "row",
      height: BAR_HEIGHT,
      borderRadius: Radius.full,
      overflow: "hidden",
      backgroundColor: colors.surfaceSecondary,
      gap: 1,
    },

    legend: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.md,
    },

    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },

    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },

    legendName: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
    },

    legendPct: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },

    barSkeleton: {
      height: BAR_HEIGHT,
      borderRadius: Radius.full,
      backgroundColor: colors.surfaceSecondary,
    },

    legendSkeleton: {
      height: 12,
      width: 200,
      borderRadius: 4,
      backgroundColor: colors.surfaceSecondary,
    },
  });
}
