import { type ColorTokens, FontFamily, FontSize, Radius, Spacing } from "@/constants/theme";
import type { GitHubPullRequestFile } from "@/types/github.types";
import { Octicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { DiffStat, getFileStatusDisplay } from "@/components/repo/DiffStat";

/** Which query holds the files; the diff screen reads it back from cache. */
export type DiffSource =
  | { source: "pr"; number: string }
  | { source: "commit"; sha: string }
  | { source: "compare"; base: string; head: string };

/**
 * Collapsible "N files changed" card. Tapping a file opens its diff full
 * screen (D-012).
 */
export function DiffFileList({
  files,
  colors,
  repoId,
  diffSource,
  totals,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  prNumber,
}: {
  files: GitHubPullRequestFile[];
  colors: ColorTokens;
  repoId: string;
  diffSource: DiffSource;
  /** Whole-diff counts, for when `files` is only the pages loaded so far. */
  totals?: { files: number; additions: number; deletions: number };
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  prNumber?: string;
}) {
  const s = useMemo(() => buildStyles(colors), [colors]);
  const [sectionExpanded, setSectionExpanded] = useState(false);

  const fileCount = totals?.files ?? files.length;
  const totalAdditions = totals?.additions ?? files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = totals?.deletions ?? files.reduce((sum, f) => sum + f.deletions, 0);

  const openFile = (filename: string) => {
    router.push({
      pathname: "/(app)/repo/[repoId]/diff",
      params: {
        repoId,
        filename,
        ...diffSource,
        ...(prNumber ? { prNumber } : {}),
      },
    });
  };

  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable style={s.sectionHeader} onPress={() => setSectionExpanded((v) => !v)}>
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
          {fileCount} file{fileCount === 1 ? "" : "s"} changed
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
          <DiffStat additions={totalAdditions} deletions={totalDeletions} />
          <Octicons
            name={sectionExpanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={colors.textMuted}
          />
        </View>
      </Pressable>

      {sectionExpanded &&
        files.map((file) => {
          const display = getFileStatusDisplay(file.status, colors);

          return (
            <Pressable
              key={file.filename}
              style={({ pressed }) => [s.row, pressed && s.rowPressed]}
              onPress={() => openFile(file.filename)}
              accessibilityRole="button"
              accessibilityLabel={`${file.filename}, ${file.additions} additions, ${file.deletions} deletions`}
            >
              <Octicons name={display.icon} size={14} color={display.color} />
              <Text style={[s.rowText, { color: colors.textPrimary }]} numberOfLines={1}>
                {file.filename}
              </Text>
              <DiffStat additions={file.additions} deletions={file.deletions} />
              <Octicons name="chevron-right" size={14} color={colors.textMuted} />
            </Pressable>
          );
        })}

      {sectionExpanded &&
        hasMore &&
        onLoadMore &&
        (isLoadingMore ? (
          <View style={s.row}>
            <ActivityIndicator size="small" color={colors.accent} style={s.loadMore} />
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [s.row, pressed && s.rowPressed]}
            onPress={onLoadMore}
            accessibilityRole="button"
          >
            <Text style={[s.loadMore, s.loadMoreText, { color: colors.accent }]}>
              Load more files ({files.length} of {fileCount})
            </Text>
          </Pressable>
        ))}
    </View>
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
    loadMore: {
      flex: 1,
      textAlign: "center",
    },
    loadMoreText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
    },
  });
}
