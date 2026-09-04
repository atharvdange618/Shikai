import { Octicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  FontFamily,
  FontSize,
  Spacing,
  type ColorTokens,
} from "@/constants/theme";

interface RepoActivityProps {
  openIssues: number;
  openPRs: number;
  isLoading: boolean;
  colors: ColorTokens;
  onIssuesPress: () => void;
  onIssuesPressIn: () => void;
  onPRsPress: () => void;
  onPRsPressIn: () => void;
  showReleases?: boolean;
  releaseCount?: number;
  onReleasesPress?: () => void;
  onReleasesPressIn?: () => void;
}

export function RepoActivity({
  openIssues,
  openPRs,
  isLoading,
  colors,
  onIssuesPress,
  onIssuesPressIn,
  onPRsPress,
  onPRsPressIn,
  showReleases,
  releaseCount = 0,
  onReleasesPress,
  onReleasesPressIn,
}: RepoActivityProps) {
  const s = buildStyles(colors);

  return (
    <View style={s.activityCard}>
      {isLoading ? (
        <>
          <View style={s.activityRow}>
            <View style={[s.skeleton, { width: 14, height: 14 }]} />
            <View style={[s.skeleton, { width: 24, height: 14 }]} />
            <View style={[s.skeleton, { width: 80, height: 12 }]} />
          </View>
          <View style={s.activityDivider} />
          <View style={s.activityRow}>
            <View style={[s.skeleton, { width: 14, height: 14 }]} />
            <View style={[s.skeleton, { width: 24, height: 14 }]} />
            <View style={[s.skeleton, { width: 120, height: 12 }]} />
          </View>
        </>
      ) : (
        <>
          <Pressable
            style={({ pressed }) => [
              s.activityRow,
              pressed && { opacity: 0.6 },
            ]}
            onPress={onIssuesPress}
            onPressIn={onIssuesPressIn}
          >
            <Octicons
              name="issue-opened"
              size={14}
              color={openIssues > 0 ? colors.success : colors.textMuted}
            />
            <Text style={s.activityCount}>{openIssues}</Text>
            <Text style={s.activityLabel}>Issues</Text>
            <Octicons
              name="chevron-right"
              size={12}
              color={colors.textMuted}
              style={{ marginLeft: "auto" }}
            />
          </Pressable>

          <View style={s.activityDivider} />

          <Pressable
            style={({ pressed }) => [
              s.activityRow,
              pressed && { opacity: 0.6 },
            ]}
            onPress={onPRsPress}
            onPressIn={onPRsPressIn}
          >
            <Octicons
              name="git-pull-request"
              size={14}
              color={openPRs > 0 ? colors.accent : colors.textMuted}
            />
            <Text style={s.activityCount}>{openPRs}</Text>
            <Text style={s.activityLabel}>Pull Requests</Text>
            <Octicons
              name="chevron-right"
              size={12}
              color={colors.textMuted}
              style={{ marginLeft: "auto" }}
            />
          </Pressable>

          {showReleases && (
            <>
              <View style={s.activityDivider} />

              <Pressable
                style={({ pressed }) => [
                  s.activityRow,
                  pressed && { opacity: 0.6 },
                ]}
                onPress={onReleasesPress}
                onPressIn={onReleasesPressIn}
              >
                <Octicons name="tag" size={14} color={colors.textMuted} />
                <Text style={s.activityCount}>{releaseCount}</Text>
                <Text style={s.activityLabel}>Releases</Text>
                <Octicons
                  name="chevron-right"
                  size={12}
                  color={colors.textMuted}
                  style={{ marginLeft: "auto" }}
                />
              </Pressable>
            </>
          )}
        </>
      )}
    </View>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    activityCard: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },

    activityRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      padding: Spacing.md,
    },

    activityCount: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
      fontVariant: ["tabular-nums"],
    },

    activityLabel: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textSecondary,
    },

    activityDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: Spacing.md,
    },

    skeleton: {
      borderRadius: 4,
      backgroundColor: colors.surfaceSecondary,
    },
  });
}
