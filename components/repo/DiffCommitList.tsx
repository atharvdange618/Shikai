import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
} from "@/constants/theme";
import { relativeTime } from "@/lib/utils";
import type { GitHubCommit } from "@/types/github.types";
import { Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Collapsible "N commits" card. Each row opens the commit detail screen;
 * the SHA badge still copies. Used by the PR detail and compare screens.
 */
export function DiffCommitList({
  commits,
  colors,
  repoId,
}: {
  commits: GitHubCommit[];
  colors: ColorTokens;
  repoId: string;
}) {
  const s = useMemo(() => buildStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(false);

  return (
    <View
      style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Pressable style={s.sectionHeader} onPress={() => setExpanded((v) => !v)}>
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
          {commits.length} commit{commits.length === 1 ? "" : "s"}
        </Text>
        <Octicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={colors.textMuted}
        />
      </Pressable>
      {expanded &&
        commits.map((commit) => (
          <CommitRow
            key={commit.sha}
            commit={commit}
            colors={colors}
            s={s}
            repoId={repoId}
          />
        ))}
    </View>
  );
}

function CommitRow({
  commit,
  colors,
  s,
  repoId,
}: {
  commit: GitHubCommit;
  colors: ColorTokens;
  s: ReturnType<typeof buildStyles>;
  repoId: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(commit.sha);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      onPress={() =>
        router.push({
          pathname: "/(app)/repo/[repoId]/commit/[sha]",
          params: { repoId, sha: commit.sha },
        })
      }
    >
      <Octicons name="git-commit" size={14} color={colors.textMuted} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={[s.rowText, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {commit.commit.message.split("\n")[0]}
        </Text>
        <Text style={s.commitMeta}>
          {commit.commit.author.name} · {relativeTime(commit.commit.author.date)}
        </Text>
      </View>
      <Pressable onPress={handleCopy} hitSlop={8} style={s.shaBadge}>
        <Text style={[s.shaText, copied && { color: colors.success }]}>
          {copied ? "Copied" : commit.sha.slice(0, 7)}
        </Text>
      </Pressable>
    </Pressable>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: Radius.lg,
      overflow: "hidden",
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    sectionTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.label,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    rowPressed: {
      backgroundColor: colors.surfaceSecondary,
    },
    rowText: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
    },
    commitMeta: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
      color: colors.textMuted,
    },
    shaBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: Radius.sm,
      backgroundColor: colors.surfaceSecondary,
    },
    shaText: {
      fontFamily: FontFamily.mono,
      fontSize: 11,
      color: colors.textSecondary,
    },
  });
}
