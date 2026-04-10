import { Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import {
  DarkColors,
  FontFamily,
  FontSize,
  IconSize,
  LightColors,
  Radius,
  Shadows,
  Spacing,
} from "@/constants/theme";
import type { PinnedRepoNode } from "@/types/github-graphql.types";

import languageColors from "@/constants/language-colors.json";

const CARD_WIDTH = 220;

interface PinnedRepoCardProps {
  repo: PinnedRepoNode;
}

export function PinnedRepoCard({ repo }: PinnedRepoCardProps) {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const shadows = isDark ? {} : Shadows.light.sm;
  const router = useRouter();

  const urlParts = repo.url.split("/");
  const owner = urlParts[urlParts.length - 2] ?? "";
  const repoId = `${owner}__${repo.name}`;

  function handlePress() {
    router.push(`/(app)/(tabs)/repos/${repoId}`);
  }

  const langColor = repo.primaryLanguage?.name
    ? ((languageColors as Record<string, { color: string | null }>)[
        repo.primaryLanguage.name
      ]?.color ?? colors.textMuted)
    : null;

  const s = buildStyles(colors, shadows);

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
      onPress={handlePress}
    >
      <View style={s.topRow}>
        <Octicons name="repo" size={IconSize.sm} color={colors.textSecondary} />
        <Text style={s.repoName} numberOfLines={1}>
          {repo.name}
        </Text>
        {repo.isPrivate && (
          <View style={s.privateBadge}>
            <Text style={s.privateBadgeText}>Private</Text>
          </View>
        )}
      </View>

      {repo.description ? (
        <Text style={s.description} numberOfLines={2}>
          {repo.description}
        </Text>
      ) : (
        <Text style={s.descriptionEmpty}>No description</Text>
      )}

      <View style={s.footer}>
        {repo.primaryLanguage && (
          <View style={s.langRow}>
            <View
              style={[
                s.langDot,
                { backgroundColor: langColor ?? colors.textMuted },
              ]}
            />
            <Text style={s.langName} numberOfLines={1}>
              {repo.primaryLanguage.name}
            </Text>
          </View>
        )}

        <View style={s.statsRow}>
          {repo.stargazerCount > 0 && (
            <View style={s.stat}>
              <Octicons name="star" size={12} color={colors.star} />
              <Text style={s.statText}>{formatCount(repo.stargazerCount)}</Text>
            </View>
          )}
          {repo.forkCount > 0 && (
            <View style={s.stat}>
              <Octicons name="repo-forked" size={12} color={colors.textMuted} />
              <Text style={s.statText}>{formatCount(repo.forkCount)}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function buildStyles(
  colors: typeof LightColors | typeof DarkColors,
  shadows: object,
) {
  return StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.sm,
      ...shadows,
    },

    cardPressed: {
      opacity: 0.75,
    },

    topRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },

    repoName: {
      flex: 1,
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.label,
      color: colors.accent,
    },

    privateBadge: {
      backgroundColor: colors.badgePrivateBg,
      borderRadius: Radius.full,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },

    privateBadgeText: {
      fontFamily: FontFamily.medium,
      fontSize: 9,
      color: colors.badgePrivateText,
    },

    description: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
      lineHeight: FontSize.caption * 1.5,
      flex: 1,
    },

    descriptionEmpty: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      fontStyle: "italic",
      flex: 1,
    },

    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: "auto",
    },

    langRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flex: 1,
    },

    langDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    langName: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
    },

    statsRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },

    stat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },

    statText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
    },
  });
}
