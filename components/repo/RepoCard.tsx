import { Octicons } from "@expo/vector-icons";
import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import languageColors from "@/constants/language-colors.json";
import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Shadows,
  Spacing,
} from "@/constants/theme";
import { encodeRepoId, formatCount, relativeTime } from "@/lib/utils";
import { useWatchlistStore } from "@/stores/watchlist.store";
import type { GitHubRepo, RepoListParams } from "@/types/github.types";

interface RepoCardProps {
  repo: GitHubRepo;
  sort?: RepoListParams["sort"];
  colors: ColorTokens;
  isDark: boolean;
  onPress?: (repo: GitHubRepo) => void;
  onPressIn?: (repo: GitHubRepo) => void;
}

export const RepoCard = memo(function RepoCard({
  repo,
  sort = "pushed",
  colors,
  isDark,
  onPress,
  onPressIn,
}: RepoCardProps) {
  const s = useMemo(
    () => buildStyles(colors, isDark ? {} : Shadows.light.sm),
    [colors, isDark],
  );

  const repoId = encodeRepoId(repo.owner.login, repo.name);
  const isWatchlisted = useWatchlistStore((state) =>
    state.watchlistIds.includes(repoId),
  );
  const toggleWatchlist = useWatchlistStore((state) => state.toggleWatchlist);

  const handleBookmarkPress = useCallback(
    (e: { stopPropagation?: () => void }) => {
      e.stopPropagation?.();
      toggleWatchlist(repoId);
    },
    [repoId, toggleWatchlist],
  );

  const langColor = repo.language
    ? ((languageColors as Record<string, { color: string | null }>)[
        repo.language
      ]?.color ?? colors.textMuted)
    : null;

  const timestampLabel =
    sort === "pushed" ? "Pushed" : sort === "created" ? "Created" : "Updated";
  const timestampValue =
    sort === "pushed"
      ? repo.pushed_at
      : sort === "created"
        ? repo.created_at
        : repo.updated_at;

  const timeAgo = useMemo(() => relativeTime(timestampValue), [timestampValue]);

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
      onPress={onPress ? () => onPress(repo) : undefined}
      onPressIn={onPressIn ? () => onPressIn(repo) : undefined}
    >
      <View style={s.titleRow}>
        <Octicons
          name="repo"
          size={14}
          color={colors.textSecondary}
          style={s.repoIcon}
        />
        <Text style={s.repoName} numberOfLines={1}>
          {repo.name}
        </Text>
        {repo.fork && <ForkBadge colors={colors} />}
        <VisibilityBadge isPrivate={repo.private} colors={colors} />
        <Pressable
          onPress={handleBookmarkPress}
          hitSlop={8}
          style={s.bookmarkButton}
          accessibilityLabel={
            isWatchlisted ? "Remove from watchlist" : "Add to watchlist"
          }
          accessibilityRole="button"
        >
          <Octicons
            name={isWatchlisted ? "bookmark-filled" : "bookmark"}
            size={14}
            color={isWatchlisted ? colors.accent : colors.textMuted}
          />
        </Pressable>
      </View>

      {repo.description ? (
        <Text style={s.description} numberOfLines={2}>
          {repo.description}
        </Text>
      ) : null}

      <View style={s.metaRow}>
        {repo.language ? (
          <View style={s.metaItem}>
            <View
              style={[
                s.langDot,
                langColor ? { backgroundColor: langColor } : s.langDotDefault,
              ]}
            />
            <Text style={s.metaText}>{repo.language}</Text>
          </View>
        ) : null}

        {repo.stargazers_count > 0 && (
          <View style={s.metaItem}>
            <Octicons name="star" size={11} color={colors.star} />
            <Text style={s.metaText}>{formatCount(repo.stargazers_count)}</Text>
          </View>
        )}

        {repo.forks_count > 0 && (
          <View style={s.metaItem}>
            <Octicons name="repo-forked" size={11} color={colors.textMuted} />
            <Text style={s.metaText}>{formatCount(repo.forks_count)}</Text>
          </View>
        )}

        {repo.open_issues_count > 0 && (
          <View style={s.metaItem}>
            <Octicons name="issue-opened" size={11} color={colors.textMuted} />
            <Text style={s.metaText}>
              {formatCount(repo.open_issues_count)}
            </Text>
          </View>
        )}

        {repo.license && (
          <View style={s.metaItem}>
            <Octicons name="law" size={11} color={colors.textMuted} />
            <Text style={s.metaText}>{repo.license.spdx_id}</Text>
          </View>
        )}

        <View style={[s.metaItem, s.metaRight]}>
          <Text style={s.metaText}>
            {timestampLabel} {timeAgo}
          </Text>
        </View>
      </View>

      {repo.topics.length > 0 && (
        <View style={s.topicsContainer}>
          {repo.topics.slice(0, 4).map((topic) => (
            <View key={topic} style={s.topicPill}>
              <Text style={s.topicText}>{topic}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
});

function ForkBadge({ colors }: { colors: ColorTokens }) {
  return (
    <View
      style={{
        backgroundColor: colors.badgeForkBg,
        borderRadius: Radius.full,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: colors.accentMuted,
      }}
    >
      <Text
        style={{
          fontFamily: FontFamily.medium,
          fontSize: 10,
          color: colors.badgeForkText,
        }}
      >
        Fork
      </Text>
    </View>
  );
}

function VisibilityBadge({
  isPrivate,
  colors,
}: {
  isPrivate: boolean;
  colors: ColorTokens;
}) {
  return (
    <View
      style={{
        backgroundColor: isPrivate
          ? colors.badgePrivateBg
          : colors.badgePublicBg,
        borderRadius: Radius.full,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: isPrivate ? colors.border : colors.successSubtle,
      }}
    >
      <Text
        style={{
          fontFamily: FontFamily.medium,
          fontSize: 10,
          color: isPrivate ? colors.badgePrivateText : colors.badgePublicText,
        }}
      >
        {isPrivate ? "Private" : "Public"}
      </Text>
    </View>
  );
}

function buildStyles(colors: ColorTokens, shadows: object) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.sm,
      ...shadows,
    },

    cardPressed: {
      opacity: 0.7,
    },

    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },

    bookmarkButton: {
      padding: 2,
    },

    repoIcon: {
      flexShrink: 0,
    },

    repoName: {
      flex: 1,
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.accent,
    },

    description: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textSecondary,
      lineHeight: FontSize.label * 1.5,
    },

    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },

    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    metaRight: {
      flex: 1,
      justifyContent: "flex-end",
    },

    metaText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
    },

    langDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },

    langDotDefault: {
      backgroundColor: colors.textMuted,
    },

    topicsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },

    topicPill: {
      backgroundColor: colors.accentSubtle,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: colors.accentMuted,
    },

    topicText: {
      fontFamily: FontFamily.medium,
      fontSize: 10,
      color: colors.accent,
    },
  });
}
