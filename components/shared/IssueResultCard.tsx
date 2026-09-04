import { Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
} from "@/constants/theme";
import { encodeRepoId } from "@/lib/utils";
import type { GitHubIssue } from "@/types/github.types";

function parseRepo(repositoryUrl: string | undefined) {
  const match = repositoryUrl?.match(/\/repos\/([^/]+)\/([^/]+)$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

export const IssueResultCard = memo(function IssueResultCard({
  issue,
  colors,
}: {
  issue: GitHubIssue;
  colors: ColorTokens;
}) {
  const router = useRouter();
  const s = useMemo(() => buildStyles(colors), [colors]);
  const isPR = Boolean(issue.pull_request);

  const handlePress = useCallback(() => {
    const parsed = parseRepo(issue.repository_url);
    if (!parsed) return;
    const repoId = encodeRepoId(parsed.owner, parsed.repo);
    router.push({
      pathname: isPR
        ? "/(app)/repo/[repoId]/pr/[number]"
        : "/(app)/repo/[repoId]/issue/[number]",
      params: { repoId, number: String(issue.number) },
    });
  }, [router, issue.repository_url, issue.number, isPR]);

  const repoFullName = parseRepo(issue.repository_url);

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.7 }]}
      onPress={handlePress}
    >
      <View style={s.header}>
        <Octicons
          name={isPR ? "git-pull-request" : "issue-opened"}
          size={14}
          color={isPR ? colors.merged : colors.success}
        />
        <Text style={s.title} numberOfLines={1}>
          {issue.title}
        </Text>
      </View>
      <Text style={s.meta} numberOfLines={1}>
        #{issue.number}
        {issue.user && ` by ${issue.user.login}`}
        {issue.state && ` · ${issue.state}`}
      </Text>
      {repoFullName && (
        <Text style={s.repo} numberOfLines={1}>
          {repoFullName.owner}/{repoFullName.repo}
        </Text>
      )}
    </Pressable>
  );
});

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    title: {
      flex: 1,
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
    },
    meta: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      marginLeft: 22,
    },
    repo: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
      marginLeft: 22,
    },
  });
}
