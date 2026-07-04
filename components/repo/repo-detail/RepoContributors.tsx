import { ContributorRow } from "@/components/repo/ContributorRow";
import {
  FontFamily,
  FontSize,
  IconSize,
  Radius,
  Spacing,
  type ColorTokens,
} from "@/constants/theme";
import type { GitHubContributor } from "@/types/github.types";
import { StyleSheet, Text, View } from "react-native";

interface RepoContributorsProps {
  contributors: GitHubContributor[];
  isLoading: boolean;
  colors: ColorTokens;
}

export function RepoContributors({
  contributors,
  isLoading,
  colors,
}: RepoContributorsProps) {
  const s = buildStyles(colors);

  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>Contributors</Text>
      {isLoading ? (
        <View style={s.skeletonAvatars}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View
              key={i}
              style={[
                s.skeleton,
                {
                  width: IconSize.xl,
                  height: IconSize.xl,
                  borderRadius: Radius.full,
                },
              ]}
            />
          ))}
        </View>
      ) : contributors.length === 0 ? (
        <Text style={s.noContributors}>No contributors</Text>
      ) : (
        <>
          <ContributorRow contributors={contributors} />
          <Text style={s.contributorCount}>
            {contributors.length === 1
              ? "1 contributor"
              : `${contributors.length} contributors`}
          </Text>
        </>
      )}
    </View>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    section: {
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
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

    skeletonAvatars: {
      flexDirection: "row",
      gap: Spacing.sm,
    },

    skeleton: {
      borderRadius: Radius.sm,
      backgroundColor: colors.surfaceSecondary,
    },

    noContributors: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textMuted,
    },

    contributorCount: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textSecondary,
    },
  });
}
