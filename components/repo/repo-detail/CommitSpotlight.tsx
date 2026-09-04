import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  BorderWidth,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
  type ColorTokens,
} from "@/constants/theme";
import { relativeTime } from "@/lib/utils";
import type { GitHubCommit } from "@/types/github.types";

interface CommitSpotlightProps {
  commit: GitHubCommit | undefined;
  isLoading: boolean;
  copiedHash: boolean;
  colors: ColorTokens;
  onCopyHash: () => void;
  onPress?: () => void;
}

export function CommitSpotlight({
  commit,
  isLoading,
  copiedHash,
  colors,
  onCopyHash,
  onPress,
}: CommitSpotlightProps) {
  const s = buildStyles(colors);

  if (!commit && !isLoading) return null;

  const canPress = Boolean(onPress && commit);

  return (
    <Pressable
      style={s.commitSpotlightCard}
      onPress={canPress ? onPress : undefined}
      disabled={!canPress}
    >
      {isLoading ? (
        <View style={s.commitSpotlightContent}>
          <View style={[s.skeleton, { width: "80%", height: 15 }]} />
          <View
            style={[s.skeleton, { width: "50%", height: 12, marginTop: 4 }]}
          />
        </View>
      ) : (
        <View style={s.commitSpotlightContent}>
          <Text style={s.commitMessage} numberOfLines={2} selectable>
            {commit?.commit.message.split("\n")[0]}
          </Text>
          <View style={s.commitMetaRow}>
            <Text style={s.commitMeta} selectable>
              {commit?.commit.author.name} ·{" "}
              {relativeTime(commit?.commit.author.date ?? "")}
            </Text>
            {commit && (
              <Pressable onPress={onCopyHash} hitSlop={8} style={s.hashButton}>
                <Text style={s.hashText}>
                  {copiedHash ? "Copied!" : commit.sha.slice(0, 7)}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    commitSpotlightCard: {
      padding: Spacing.md,
      gap: Spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: BorderWidth.normal,
      borderColor: colors.border,
    },

    commitSpotlightContent: {
      gap: Spacing.xs,
    },

    commitMessage: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textPrimary,
      lineHeight: FontSize.body * 1.5,
    },

    commitMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },

    commitMeta: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      flex: 1,
    },

    hashButton: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderWidth: BorderWidth.normal,
      borderColor: colors.border,
    },

    hashText: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
    },

    skeleton: {
      borderRadius: Radius.sm,
      backgroundColor: colors.surfaceSecondary,
    },
  });
}
