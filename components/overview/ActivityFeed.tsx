/**
 * Renders recent GitHub activity using GraphQL repository data.
 *
 * Shows the most recently pushed-to repositories with their latest commit:
 *   - Repository name
 *   - Latest commit message headline
 *   - Branch name
 *   - Relative timestamp
 *
 * Each item shows:
 *   - Left: commit icon
 *   - Center: commit message + repo name + branch
 *   - Right: relative timestamp
 */

import { Octicons } from "@expo/vector-icons";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

import {
  DarkColors,
  FontFamily,
  FontSize,
  LightColors,
  Radius,
  Spacing,
} from "@/constants/theme";
import { relativeTime } from "@/lib/utils";
import type { RecentRepoNode } from "@/types/github-graphql.types";

interface ActivityFeedProps {
  repos: RecentRepoNode[];
  isLoading?: boolean;
}

export function ActivityFeed({ repos, isLoading = false }: ActivityFeedProps) {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const s = buildStyles(colors);

  if (isLoading) {
    return (
      <View style={s.container}>
        <Text style={s.sectionTitle}>Recent Activity</Text>
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={s.skeletonItem}>
            <View style={s.skeletonIcon} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={[s.skeletonLine, { width: "70%" }]} />
              <View style={[s.skeletonLine, { width: "45%" }]} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (!repos.length) {
    return (
      <View style={s.container}>
        <Text style={s.sectionTitle}>Recent Activity</Text>
        <Text style={s.emptyText}>No recent activity to show.</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.sectionTitle}>Recent Activity</Text>
      {repos.slice(0, 10).map((repo) => {
        if (!repo.defaultBranchRef) return null;

        const commit = repo.defaultBranchRef.target.history.edges[0]?.node;
        if (!commit) return null;

        const branch = repo.defaultBranchRef.name;
        const time = relativeTime(commit.committedDate);
        const iconColor = colors.accent;

        return (
          <View key={repo.id} style={s.item}>
            <View style={[s.iconWrap, { backgroundColor: `${iconColor}18` }]}>
              <Octicons name="repo-push" size={14} color={iconColor} />
            </View>

            <View style={s.itemText}>
              <Text style={s.itemLabel} numberOfLines={1}>
                {commit.messageHeadline}
              </Text>
              <View style={s.repoRow}>
                <Text style={s.itemRepo} numberOfLines={1}>
                  {repo.name} → {branch}
                </Text>
                {repo.isPrivate && (
                  <Octicons
                    name="lock"
                    size={10}
                    color={colors.textMuted}
                    style={s.lockIcon}
                  />
                )}
              </View>
            </View>

            <Text style={s.timestamp}>{time}</Text>
          </View>
        );
      })}
    </View>
  );
}

function buildStyles(colors: typeof LightColors | typeof DarkColors) {
  return StyleSheet.create({
    container: {
      gap: Spacing.sm,
    },

    sectionTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
      marginBottom: Spacing.xs,
    },

    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.xs,
    },

    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: Radius.sm,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },

    itemText: {
      flex: 1,
      gap: 2,
    },

    itemLabel: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textPrimary,
    },

    repoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    itemRepo: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
      flexShrink: 1,
    },

    lockIcon: {
      marginLeft: 2,
    },

    timestamp: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      flexShrink: 0,
    },

    emptyText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textMuted,
      textAlign: "center",
      paddingVertical: Spacing.xl,
    },

    skeletonItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.xs,
    },

    skeletonIcon: {
      width: 32,
      height: 32,
      borderRadius: Radius.sm,
      backgroundColor: colors.surfaceSecondary,
      flexShrink: 0,
    },

    skeletonLine: {
      height: 10,
      borderRadius: 4,
      backgroundColor: colors.surfaceSecondary,
    },
  });
}
