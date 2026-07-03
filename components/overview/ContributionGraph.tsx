import { useCallback, useMemo, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";

import {
  FontFamily,
  FontSize,
  Layout,
  Spacing,
  useTheme,
  type ColorTokens,
} from "@/constants/theme";
import type {
  ContributionDay,
  ContributionStats,
  ContributionWeek,
} from "@/types/github-graphql.types";
import { ContributionStatsRow } from "./ContributionStatsRow";

const CELL = Layout.heatmapCellSize;
const GAP = Layout.heatmapCellGap;
const STEP = CELL + GAP;
const DAYS = 7;
const MONTH_LABEL_HEIGHT = 16;
const SVG_HEIGHT = MONTH_LABEL_HEIGHT + DAYS * STEP;

const DAY_LABELS: { label: string; row: number }[] = [
  { label: "Mon", row: 1 },
  { label: "Wed", row: 3 },
  { label: "Fri", row: 5 },
];
const DAY_LABEL_WIDTH = 28;

function getContributionColor(
  level: ContributionDay["contributionLevel"] | undefined,
  count: number,
  colors: ColorTokens,
): string {
  if (level) {
    const normalized = level.toUpperCase();
    switch (normalized) {
      case "NONE":
        return colors.contributeEmpty;
      case "FIRST_QUARTILE":
        return colors.contributeL1;
      case "SECOND_QUARTILE":
        return colors.contributeL2;
      case "THIRD_QUARTILE":
        return colors.contributeL3;
      case "FOURTH_QUARTILE":
        return colors.contributeL4;
    }
  }

  // Fallback to count-based mapping if level is undefined (e.g. from persisted cache)
  if (count === 0) return colors.contributeEmpty;
  if (count <= 2) return colors.contributeL1;
  if (count <= 4) return colors.contributeL2;
  if (count <= 6) return colors.contributeL3;
  return colors.contributeL4;
}

interface ContributionGraphProps {
  weeks: ContributionWeek[];
  totalContributions: number;
  isLoading?: boolean;
  stats?: ContributionStats | null;
}

export function ContributionGraph({
  weeks,
  totalContributions,
  isLoading = false,
  stats,
}: ContributionGraphProps) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const handleContentSizeChange = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: false });
  }, []);

  const s = useMemo(() => buildStyles(colors), [colors]);

  if (isLoading) {
    return <ContributionGraphSkeleton colors={colors} />;
  }

  if (!weeks.length) {
    return (
      <View style={s.container}>
        <Text style={s.sectionTitle}>Contributions</Text>
        <Text style={s.emptyText}>No contribution data available.</Text>
      </View>
    );
  }

  const monthLabels: { label: string; x: number }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, weekIdx) => {
    const firstDay = week.contributionDays[0];
    if (!firstDay) return;
    const month = new Date(firstDay.date).getMonth();
    if (month !== lastMonth) {
      lastMonth = month;
      monthLabels.push({
        label: new Date(firstDay.date).toLocaleString("default", {
          month: "short",
        }),
        x: weekIdx * STEP,
      });
    }
  });

  const svgWidth = weeks.length * STEP;

  return (
    <View
      style={s.container}
      accessibilityLabel={`Contribution graph: ${totalContributions.toLocaleString()} contributions this year`}
      accessibilityRole="summary"
    >
      <View style={s.header}>
        <Text style={s.sectionTitle}>Contributions</Text>
        <Text style={s.totalCount}>
          {totalContributions.toLocaleString()} this year
        </Text>
      </View>

      {stats && <ContributionStatsRow stats={stats} />}

      <View style={s.graphRow}>
        <View style={[s.dayLabels, { height: SVG_HEIGHT }]}>
          <View style={{ height: MONTH_LABEL_HEIGHT }} />
          {DAY_LABELS.map(({ label, row }) => (
            <View
              key={label}
              style={[
                s.dayLabelSlot,
                { top: MONTH_LABEL_HEIGHT + row * STEP + CELL / 2 - 5 },
              ]}
            >
              <Text style={s.dayLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={handleContentSizeChange}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
        >
          <Svg width={svgWidth} height={SVG_HEIGHT}>
            {monthLabels.map(({ label, x }) => (
              <SvgText
                key={`${label}-${x}`}
                x={x}
                y={MONTH_LABEL_HEIGHT - 3}
                fontSize={9}
                fontFamily={FontFamily.regular}
                fill={colors.textMuted}
              >
                {label}
              </SvgText>
            ))}

            {weeks.map((week, weekIdx) =>
              week.contributionDays.map((day) => (
                <Rect
                  key={day.date}
                  x={weekIdx * STEP}
                  y={MONTH_LABEL_HEIGHT + day.weekday * STEP}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  ry={2}
                  fill={getContributionColor(
                    day.contributionLevel,
                    day.contributionCount,
                    colors,
                  )}
                />
              )),
            )}
          </Svg>
        </ScrollView>
      </View>

      <View style={s.legend}>
        <Text style={s.legendLabel}>Less</Text>
        {[
          colors.contributeEmpty,
          colors.contributeL1,
          colors.contributeL2,
          colors.contributeL3,
          colors.contributeL4,
        ].map((color, i) => (
          <View key={i} style={[s.legendCell, { backgroundColor: color }]} />
        ))}
        <Text style={s.legendLabel}>More</Text>
      </View>
    </View>
  );
}

function ContributionGraphSkeleton({ colors }: { colors: ColorTokens }) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <View
        style={{
          height: 16,
          width: 120,
          borderRadius: 4,
          backgroundColor: colors.surfaceSecondary,
        }}
      />
      <View
        style={{
          height: SVG_HEIGHT,
          borderRadius: 6,
          backgroundColor: colors.surfaceSecondary,
        }}
      />
    </View>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      gap: Spacing.sm,
    },

    header: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
    },

    sectionTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
    },

    totalCount: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textSecondary,
    },

    graphRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },

    dayLabels: {
      width: DAY_LABEL_WIDTH,
      position: "relative",
    },

    dayLabelSlot: {
      position: "absolute",
      left: 0,
    },

    dayLabel: {
      fontFamily: FontFamily.regular,
      fontSize: 9,
      color: colors.textMuted,
    },

    scroll: {
      flex: 1,
    },

    scrollContent: {
      paddingRight: Spacing.xs,
    },

    legend: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },

    legendLabel: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },

    legendCell: {
      width: CELL,
      height: CELL,
      borderRadius: 2,
    },

    emptyText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textMuted,
      paddingVertical: Spacing.md,
    },
  });
}
