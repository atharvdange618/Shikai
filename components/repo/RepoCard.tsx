import { Octicons } from "@expo/vector-icons";
import { memo, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import languageColors from "@/constants/language-colors.json";
import {
  DarkColors,
  FontFamily,
  FontSize,
  LightColors,
  Radius,
  Shadows,
  Spacing,
} from "@/constants/theme";
import { formatCount, relativeTime } from "@/lib/utils";
import type { GitHubRepo, RepoListParams } from "@/types/github.types";

interface RepoCardProps {
  repo: GitHubRepo;
  sort?: RepoListParams["sort"];
  onPress?: () => void;
}

export const RepoCard = memo(function RepoCard({
  repo,
  sort = "pushed",
  onPress,
}: RepoCardProps) {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const s = useMemo(() => {
    const shadows = isDark ? {} : Shadows.light.sm;
    return buildStyles(colors, shadows);
  }, [colors, isDark]);

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

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
      onPress={onPress}
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
        <VisibilityBadge isPrivate={repo.private} colors={colors} />
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
            {timestampLabel} {relativeTime(timestampValue)}
          </Text>
        </View>
      </View>

      {repo.topics.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.topicsScroll}
          contentContainerStyle={s.topicsContent}
        >
          {repo.topics.map((topic) => (
            <View key={topic} style={s.topicPill}>
              <Text style={s.topicText}>{topic}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </Pressable>
  );
});

function VisibilityBadge({
  isPrivate,
  colors,
}: {
  isPrivate: boolean;
  colors: typeof LightColors | typeof DarkColors;
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

function buildStyles(
  colors: typeof LightColors | typeof DarkColors,
  shadows: object,
) {
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

    topicsScroll: {
      marginTop: Spacing.xs,
    },

    topicsContent: {
      gap: Spacing.xs,
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
