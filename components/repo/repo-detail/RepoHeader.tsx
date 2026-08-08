import { Octicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { InfoDot } from "@/components/shared/Tooltip";
import {
  BorderWidth,
  FontFamily,
  FontSize,
  IconSize,
  Radius,
  Spacing,
  type ColorTokens,
} from "@/constants/theme";
import type { GitHubRepo } from "@/types/github.types";

import { getHealthBadges } from "./repo-detail-helpers";

interface RepoHeaderProps {
  repo: GitHubRepo | undefined;
  owner: string;
  readme: string | undefined;
  isLoading: boolean;
  colors: ColorTokens;
  onOwnerPress: () => void;
}

export function RepoHeader({
  repo,
  owner,
  readme,
  isLoading,
  colors,
  onOwnerPress,
}: RepoHeaderProps) {
  const s = buildStyles(colors);
  const badges = getHealthBadges(repo, readme, isLoading);

  if (isLoading) {
    return (
      <View style={s.headerCard}>
        <View style={[s.skeleton, { width: 80, height: 12 }]} />
        <View style={[s.skeleton, { width: 160, height: 22 }]} />
        <View style={[s.skeleton, { width: "100%", height: 40 }]} />
      </View>
    );
  }

  return (
    <View style={s.headerCard}>
      <Pressable onPress={onOwnerPress} hitSlop={8}>
        {({ pressed }) => (
          <Text
            style={[
              s.ownerText,
              pressed && { color: colors.accent, opacity: 0.7 },
            ]}
          >
            {owner}
          </Text>
        )}
      </Pressable>
      <View style={s.titleRow}>
        <Text style={s.repoName} numberOfLines={1}>
          {repo?.name}
        </Text>
        {repo?.fork && (
          <View
            style={[
              s.badge,
              {
                backgroundColor: colors.badgeForkBg,
                borderColor: colors.accentMuted,
              },
            ]}
          >
            <Text style={[s.badgeText, { color: colors.badgeForkText }]}>
              Fork
            </Text>
          </View>
        )}
        {repo && (
          <View
            style={[
              s.badge,
              {
                backgroundColor: repo.private
                  ? colors.badgePrivateBg
                  : colors.badgePublicBg,
                borderColor: repo.private
                  ? colors.border
                  : colors.successSubtle,
              },
            ]}
          >
            <Text
              style={[
                s.badgeText,
                {
                  color: repo.private
                    ? colors.badgePrivateText
                    : colors.badgePublicText,
                },
              ]}
            >
              {repo.private ? "Private" : "Public"}
            </Text>
          </View>
        )}
      </View>
      {badges.length > 0 && (
        <View style={s.healthBadgeRow}>
          {badges.map((badge) => (
            <InfoDot
              key={badge.label}
              label={badge.label}
              description={badge.description}
              color={badge.color}
            />
          ))}
        </View>
      )}

      {repo?.description && (
        <Text style={s.description} numberOfLines={3} selectable>
          {repo.description}
        </Text>
      )}

      {repo?.homepage && (
        <Pressable
          style={s.websiteRow}
          onPress={() => {
            try {
              Linking.openURL(repo.homepage!);
            } catch {
              /* suppressed */
            }
          }}
        >
          <Octicons name="link" size={IconSize.xs} color={colors.textLink} />
          <Text style={s.websiteText} numberOfLines={1}>
            {repo.homepage.replace(/^https?:\/\//, "")}
          </Text>
        </Pressable>
      )}

      {repo?.topics && repo.topics.length > 0 && (
        <View style={s.topicsRow}>
          {repo.topics.map((topic: string) => (
            <View key={topic} style={s.topicPill}>
              <Text style={s.topicText}>{topic}</Text>
            </View>
          ))}
        </View>
      )}

      {repo?.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION" && (
        <View style={s.licenseRow}>
          <Octicons name="law" size={IconSize.xs} color={colors.textMuted} />
          <Text style={s.licenseText}>{repo.license.spdx_id}</Text>
        </View>
      )}
    </View>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    headerCard: {
      padding: Spacing.md,
      gap: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },

    ownerText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      textDecorationLine: "underline",
      textDecorationColor: colors.textMuted,
    },

    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: Spacing.xs,
    },

    repoName: {
      flexShrink: 1,
      fontFamily: FontFamily.bold,
      fontSize: FontSize.heading,
      color: colors.textPrimary,
    },

    badge: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderWidth: BorderWidth.normal,
    },

    badgeText: {
      fontFamily: FontFamily.medium,
      fontSize: 10,
    },

    healthBadgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
      marginTop: 2,
    },

    description: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textSecondary,
      lineHeight: FontSize.body * 1.5,
    },

    websiteRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },

    websiteText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textLink,
      flex: 1,
    },

    topicsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
    },

    topicPill: {
      backgroundColor: colors.accentSubtle,
      borderRadius: Radius.full,
      borderWidth: BorderWidth.normal,
      borderColor: colors.accentMuted,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },

    topicText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.accent,
    },

    licenseRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },

    licenseText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },

    skeleton: {
      borderRadius: Radius.sm,
      backgroundColor: colors.surfaceSecondary,
    },
  });
}
