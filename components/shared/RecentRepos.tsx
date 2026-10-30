import { Octicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  FontFamily,
  FontSize,
  Radius,
  Spacing,
  useTheme,
  type ColorTokens,
} from "@/constants/theme";
import { prefetchRepoDetails } from "@/lib/prefetch";
import { encodeRepoId, formatCount } from "@/lib/utils";
import type { GitHubRepo } from "@/types/github.types";

interface RecentReposProps {
  repos: GitHubRepo[] | undefined;
  isLoading: boolean;
  onSeeAll: () => void;
}

// fetchUserRepos sorts by "updated", so this is recent activity, not stars.
/** A profile's five most recently updated public repos. Renders nothing when there are none. */
export function RecentRepos({ repos, isLoading, onSeeAll }: RecentReposProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const s = useMemo(() => buildStyles(colors), [colors]);

  if (!isLoading && !repos?.length) return null;

  return (
    <View style={s.section}>
      <View style={s.header}>
        <Text style={s.title}>Recently updated</Text>
        {!isLoading && (
          <Pressable
            onPress={onSeeAll}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={s.seeAll}>See all</Text>
          </Pressable>
        )}
      </View>

      {isLoading
        ? [1, 2, 3].map((i) => <View key={i} style={s.skeleton} />)
        : repos?.slice(0, 5).map((repo) => (
            <Pressable
              key={repo.id}
              style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
              onPress={() =>
                router.push({
                  pathname: "/(app)/repo/[repoId]",
                  params: { repoId: encodeRepoId(repo.owner.login, repo.name) },
                })
              }
              onPressIn={() =>
                prefetchRepoDetails(queryClient, repo.owner.login, repo.name)
              }
            >
              <View style={s.info}>
                <Text style={s.name} numberOfLines={1}>
                  {repo.name}
                </Text>
                {repo.description && (
                  <Text style={s.description} numberOfLines={1}>
                    {repo.description}
                  </Text>
                )}
              </View>
              <View style={s.stats}>
                {repo.stargazers_count > 0 && (
                  <View style={s.stat}>
                    <Octicons name="star" size={11} color={colors.star} />
                    <Text style={s.statText}>
                      {formatCount(repo.stargazers_count)}
                    </Text>
                  </View>
                )}
                {repo.forks_count > 0 && (
                  <View style={s.stat}>
                    <Octicons
                      name="repo-forked"
                      size={11}
                      color={colors.textMuted}
                    />
                    <Text style={s.statText}>
                      {formatCount(repo.forks_count)}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))}
    </View>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    section: {
      gap: Spacing.sm,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.xs,
    },

    title: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
    },

    seeAll: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.accent,
    },

    skeleton: {
      height: 60,
      borderRadius: Radius.lg,
      backgroundColor: colors.surfaceSecondary,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      gap: Spacing.md,
    },

    info: {
      flex: 1,
      gap: 2,
    },

    name: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.accent,
    },

    description: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
    },

    stats: {
      flexDirection: "row",
      gap: Spacing.md,
    },

    stat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    statText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },
  });
}
