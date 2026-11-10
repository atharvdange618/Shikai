import {
  AvatarSize,
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Shadows,
  Spacing,
  useTheme,
} from "@/constants/theme";
import { relativeTime } from "@/lib/utils";
import type { GitHubCommit } from "@/types/github.types";
import { Octicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

/**
 * One commit as a card: avatar, subject, author and age, plus a SHA badge that
 * copies. Shared so the repo's commits list and a PR's commit list read the
 * same.
 *
 * `prNumber` is forwarded to the commit screen, which uses it to offer the PR
 * diff for that commit.
 */
export const CommitCard = memo(function CommitCard({
  commit,
  repoId,
  prNumber,
}: {
  commit: GitHubCommit;
  repoId: string;
  prNumber?: string;
}) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const shadows = useMemo(() => (isDark ? {} : Shadows.light.sm), [isDark]);
  const s = useMemo(() => buildStyles(colors), [colors]);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(commit.sha);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [commit.sha]);

  const handlePress = useCallback(() => {
    router.push({
      pathname: "/(app)/repo/[repoId]/commit/[sha]",
      params: {
        repoId,
        sha: commit.sha,
        ...(prNumber ? { prNumber } : {}),
      },
    });
  }, [router, repoId, commit.sha, prNumber]);

  const subject = commit.commit.message.split("\n")[0];
  const authorName = commit.commit.author.name;
  const timestamp = relativeTime(commit.commit.author.date);
  const avatarUrl = commit.author?.avatar_url;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${subject}, ${authorName}, ${timestamp}`}
      style={({ pressed }) => [s.item, shadows, pressed && s.itemPressed]}
      onPress={handlePress}
    >
      <View style={s.avatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={s.avatar} contentFit="cover" transition={150} />
        ) : (
          <View style={[s.avatar, s.avatarFallback]}>
            <Octicons name="person" size={12} color={colors.textMuted} />
          </View>
        )}
      </View>

      <View style={s.textBlock}>
        <Text style={s.message} numberOfLines={2}>
          {subject}
        </Text>
        <Text style={s.meta} numberOfLines={1}>
          {authorName}
          <Text style={s.metaDot}> · </Text>
          {timestamp}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Copy commit SHA ${commit.sha}`}
        onPress={handleCopy}
        hitSlop={8}
        style={({ pressed }) => [s.shaBadge, pressed && s.shaBadgePressed]}
      >
        <Octicons
          name={copied ? "check" : "copy"}
          size={10}
          color={copied ? colors.success : colors.textMuted}
        />
        <Text style={[s.shaText, copied && s.shaTextCopied]}>
          {copied ? "Copied" : commit.sha.slice(0, 7)}
        </Text>
      </Pressable>
    </Pressable>
  );
});

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    item: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
    },

    itemPressed: {
      opacity: 0.6,
    },

    avatarWrap: {
      flexShrink: 0,
      marginTop: 1,
    },

    avatar: {
      width: AvatarSize.sm,
      height: AvatarSize.sm,
      borderRadius: AvatarSize.sm / 2,
      borderWidth: 1,
      borderColor: colors.border,
    },

    avatarFallback: {
      backgroundColor: colors.surfaceSecondary,
      alignItems: "center",
      justifyContent: "center",
    },

    textBlock: {
      flex: 1,
      gap: 4,
    },

    message: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textPrimary,
      lineHeight: FontSize.label * 1.5,
    },

    meta: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
    },

    metaDot: {
      color: colors.textMuted,
    },

    shaBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      flexShrink: 0,
      marginTop: 1,
    },

    shaBadgePressed: {
      opacity: 0.6,
    },

    shaText: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
    },

    shaTextCopied: {
      color: colors.success,
    },
  });
}
