import { Octicons } from "@expo/vector-icons";
import type { UseQueryResult } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  AvatarSize,
  type ColorTokens,
  FontFamily,
  FontSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";
import {
  useCommitActivity,
  useContributorStats,
  usePunchCard,
} from "@/hooks/useRepoInsights";
import {
  buildPunchCard,
  type ContributorSummary,
  formatHour,
  type HeatLevel,
  summarizeContributors,
} from "@/lib/insights";
import { isStatsPending } from "@/lib/query-client";
import { decodeRepoId, formatCount } from "@/lib/utils";
import type { GitHubCommitActivityWeek } from "@/types/github.types";

const TOP_CONTRIBUTORS = 10;
const BAR_CHART_HEIGHT = 96;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_TICKS = [0, 6, 12, 18];

export default function InsightsScreen() {
  const { repoId } = useLocalSearchParams<{ repoId: string }>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const [refreshing, setRefreshing] = useState(false);

  const activity = useCommitActivity(owner, repoName);
  const contributors = useContributorStats(owner, repoName);
  const punchCard = usePunchCard(owner, repoName);

  useEffect(() => {
    try {
      navigation.setOptions({
        title: "Insights",
        headerRight: () => (
          <Pressable
            hitSlop={12}
            style={{ marginRight: Spacing.sm, padding: Spacing.xs }}
            onPress={() =>
              WebBrowser.openBrowserAsync(
                `https://github.com/${owner}/${repoName}/pulse`,
              )
            }
          >
            <Octicons name="link-external" size={16} color={colors.accent} />
          </Pressable>
        ),
      });
    } catch {
      /* navigator not ready yet */
    }
  }, [navigation, owner, repoName, colors.accent]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      activity.refetch(),
      contributors.refetch(),
      punchCard.refetch(),
    ]);
    setRefreshing(false);
  }, [activity, contributors, punchCard]);

  const s = useMemo(() => buildStyles(colors), [colors]);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      <StatsSection title="Commit activity" query={activity} colors={colors}>
        {(weeks) => <ActivityBars weeks={weeks} colors={colors} />}
      </StatsSection>

      <StatsSection title="Top contributors" query={contributors} colors={colors}>
        {(stats) => (
          <ContributorList
            {...summarizeContributors(stats, TOP_CONTRIBUTORS)}
            colors={colors}
          />
        )}
      </StatsSection>

      <StatsSection title="When people commit" query={punchCard} colors={colors}>
        {(entries) => <PunchCard grid={buildPunchCard(entries)} colors={colors} />}
      </StatsSection>
    </ScrollView>
  );
}

/**
 * Shared loading/error shell. While GitHub answers 202 the query stays in its
 * loading state through the retries, so `failureReason` tells us to say
 * "building" instead of a bare spinner.
 */
function StatsSection<T>({
  title,
  query,
  colors,
  children,
}: {
  title: string;
  query: UseQueryResult<T[]>;
  colors: ColorTokens;
  children: (data: T[]) => ReactNode;
}) {
  const s = useMemo(() => buildStyles(colors), [colors]);

  let body: ReactNode;
  if (query.data) {
    body = children(query.data);
  } else if (query.isError) {
    body = isStatsPending(query.error) ? (
      <Text style={s.muted}>
        GitHub is still computing these stats. Pull down to refresh in a
        minute.
      </Text>
    ) : (
      <View style={s.errorRow}>
        <Text style={s.muted}>Couldn&apos;t load these stats.</Text>
        <Pressable hitSlop={8} onPress={() => query.refetch()}>
          <Text style={s.link}>Try again</Text>
        </Pressable>
      </View>
    );
  } else {
    body = (
      <View style={s.loadingRow}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={s.muted}>
          {query.failureReason && isStatsPending(query.failureReason)
            ? "GitHub is building these stats…"
            : "Loading…"}
        </Text>
      </View>
    );
  }

  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>{title}</Text>
      {body}
    </View>
  );
}

function ActivityBars({
  weeks,
  colors,
}: {
  weeks: GitHubCommitActivityWeek[];
  colors: ColorTokens;
}) {
  const s = useMemo(() => buildStyles(colors), [colors]);
  const total = weeks.reduce((sum, w) => sum + w.total, 0);
  const max = Math.max(1, ...weeks.map((w) => w.total));

  if (total === 0) {
    return <Text style={s.muted}>No commits in the past year.</Text>;
  }

  return (
    <View style={s.chartBlock}>
      <Text style={s.headline}>
        {formatCount(total)}{" "}
        <Text style={s.headlineSub}>commits in the past year</Text>
      </Text>
      <View style={s.bars}>
        {weeks.map((w) => (
          <View
            key={w.week}
            style={[
              s.bar,
              w.total === 0
                ? { height: 2, backgroundColor: colors.contributeEmpty }
                : {
                    height: Math.max(3, (w.total / max) * BAR_CHART_HEIGHT),
                    backgroundColor: colors.accent,
                  },
            ]}
          />
        ))}
      </View>
      <View style={s.axisRow}>
        <Text style={s.axisText}>52 weeks ago</Text>
        <Text style={s.axisText}>This week</Text>
      </View>
    </View>
  );
}

function ContributorList({
  top,
  hasLineCounts,
  colors,
}: {
  top: ContributorSummary[];
  hasLineCounts: boolean;
  colors: ColorTokens;
}) {
  const router = useRouter();
  const s = useMemo(() => buildStyles(colors), [colors]);

  if (top.length === 0) {
    return <Text style={s.muted}>No contributors yet.</Text>;
  }

  // ponytail: plain map, not FlashList; capped at TOP_CONTRIBUTORS rows.
  return (
    <View>
      {top.map((c, i) => {
        const login = c.author?.login;
        return (
          <Pressable
            key={login ?? `unknown-${i}`}
            disabled={!login}
            style={({ pressed }) => [s.contributor, pressed && s.pressed]}
            onPress={() =>
              login &&
              router.push({
                pathname: "/(app)/user/[username]",
                params: { username: login },
              })
            }
          >
            {c.author ? (
              <Image
                source={{ uri: c.author.avatar_url }}
                style={s.avatar}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Octicons name="person" size={14} color={colors.textMuted} />
              </View>
            )}
            <View style={s.contributorBody}>
              <Text style={s.contributorName} numberOfLines={1}>
                {login ?? "Unknown author"}
              </Text>
              <Text style={s.contributorMeta}>
                {formatCount(c.commits)}{" "}
                {c.commits === 1 ? "commit" : "commits"}
              </Text>
            </View>
            {hasLineCounts && (
              <View style={s.lines}>
                <Text style={[s.lineText, { color: colors.success }]}>
                  +{formatCount(c.additions)}
                </Text>
                <Text style={[s.lineText, { color: colors.danger }]}>
                  -{formatCount(c.deletions)}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
      {!hasLineCounts && (
        <Text style={[s.muted, s.footnote]}>
          GitHub skips line counts for repos with 10,000+ commits.
        </Text>
      )}
    </View>
  );
}

function PunchCard({
  grid,
  colors,
}: {
  grid: ReturnType<typeof buildPunchCard>;
  colors: ColorTokens;
}) {
  const s = useMemo(() => buildStyles(colors), [colors]);
  const shades: Record<HeatLevel, string> = {
    0: colors.contributeEmpty,
    1: colors.contributeL1,
    2: colors.contributeL2,
    3: colors.contributeL3,
    4: colors.contributeL4,
  };

  if (!grid.busiest) {
    return <Text style={s.muted}>No commits yet.</Text>;
  }

  return (
    <View style={s.chartBlock}>
      <Text style={s.headlineSub}>
        Busiest: {DAY_LABELS[grid.busiest.day]} around{" "}
        {formatHour(grid.busiest.hour)}
      </Text>

      <View style={s.punchGrid}>
        {grid.levels.map((row, day) => (
          <View key={day} style={s.punchRow}>
            <Text style={s.dayLabel}>{DAY_LABELS[day]}</Text>
            {row.map((level, hour) => (
              <View
                key={hour}
                style={[s.punchCell, { backgroundColor: shades[level] }]}
              />
            ))}
          </View>
        ))}

        <View style={s.punchRow}>
          <View style={s.dayLabelSpacer} />
          <View style={s.hourTicks}>
            {HOUR_TICKS.map((h) => (
              <Text
                key={h}
                style={[s.axisText, s.hourTick, { left: `${(h / 24) * 100}%` }]}
              >
                {formatHour(h)}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <View style={s.legend}>
        <Text style={s.axisText}>Less</Text>
        {([0, 1, 2, 3, 4] as const).map((l) => (
          <View key={l} style={[s.legendCell, { backgroundColor: shades[l] }]} />
        ))}
        <Text style={s.axisText}>More</Text>
      </View>
      <Text style={[s.muted, s.footnote]}>
        Hours use each commit&apos;s local time.
      </Text>
    </View>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: Layout.screenPadding,
      paddingBottom: Spacing.xxl,
    },
    section: {
      gap: Spacing.md,
      paddingVertical: Spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    sectionLabel: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    muted: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textMuted,
      lineHeight: FontSize.label * 1.5,
    },
    link: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.accent,
    },
    footnote: {
      fontSize: FontSize.caption,
      lineHeight: FontSize.caption * 1.5,
      marginTop: Spacing.sm,
    },
    errorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    pressed: {
      opacity: 0.6,
    },

    chartBlock: {
      gap: Spacing.sm,
    },
    headline: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
    },
    headlineSub: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textSecondary,
    },
    bars: {
      height: BAR_CHART_HEIGHT,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 1,
    },
    bar: {
      flex: 1,
      borderRadius: 1,
    },
    axisRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    axisText: {
      fontFamily: FontFamily.regular,
      fontSize: 10,
      color: colors.textMuted,
    },

    contributor: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    avatar: {
      width: AvatarSize.sm,
      height: AvatarSize.sm,
      borderRadius: Radius.full,
    },
    avatarFallback: {
      backgroundColor: colors.surfaceSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    contributorBody: {
      flex: 1,
      gap: 2,
    },
    contributorName: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textPrimary,
    },
    contributorMeta: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },
    lines: {
      alignItems: "flex-end",
      gap: 2,
    },
    lineText: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize.caption,
    },

    punchGrid: {
      gap: 2,
    },
    punchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    dayLabel: {
      width: 28,
      fontFamily: FontFamily.regular,
      fontSize: 10,
      color: colors.textMuted,
    },
    dayLabelSpacer: {
      width: 28,
    },
    punchCell: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 2,
    },
    hourTicks: {
      flex: 1,
      height: 14,
    },
    hourTick: {
      position: "absolute",
      top: 0,
    },
    legend: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-end",
      gap: 3,
      marginTop: Spacing.xs,
    },
    legendCell: {
      width: 10,
      height: 10,
      borderRadius: 2,
    },
  });
}
