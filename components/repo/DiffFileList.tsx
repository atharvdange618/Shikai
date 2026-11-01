import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
} from "@/constants/theme";
import type { GitHubPullRequestFile } from "@/types/github.types";
import { Octicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

function getFileStatusDisplay(
  status: GitHubPullRequestFile["status"],
  colors: ColorTokens,
): { icon: React.ComponentProps<typeof Octicons>["name"]; color: string } {
  switch (status) {
    case "added":
      return { icon: "diff-added", color: colors.success };
    case "removed":
      return { icon: "diff-removed", color: colors.danger };
    case "renamed":
      return { icon: "diff-renamed", color: colors.textMuted };
    default:
      return { icon: "diff-modified", color: colors.warning };
  }
}

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
}: {
  files: GitHubPullRequestFile[];
  colors: ColorTokens;
  repoId: string;
  diffSource: DiffSource;
}) {
  const s = useMemo(() => buildStyles(colors), [colors]);
  const [sectionExpanded, setSectionExpanded] = useState(false);

  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  const openFile = (filename: string) => {
    router.push({
      pathname: "/(app)/repo/[repoId]/diff",
      params: { repoId, filename, ...diffSource },
    });
  };

  return (
    <View
      style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Pressable
        style={s.sectionHeader}
        onPress={() => setSectionExpanded((v) => !v)}
      >
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
          {files.length} file{files.length === 1 ? "" : "s"} changed
        </Text>
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}
        >
          <Text style={s.diffStat}>
            <Text style={{ color: colors.success }}>+{totalAdditions}</Text>{" "}
            <Text style={{ color: colors.danger }}>-{totalDeletions}</Text>
          </Text>
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
              <Text
                style={[s.rowText, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {file.filename}
              </Text>
              <Text style={s.diffStat}>
                <Text style={{ color: colors.success }}>+{file.additions}</Text>{" "}
                <Text style={{ color: colors.danger }}>-{file.deletions}</Text>
              </Text>
              <Octicons name="chevron-right" size={14} color={colors.textMuted} />
            </Pressable>
          );
        })}
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
    diffStat: {
      fontFamily: FontFamily.mono,
      fontSize: 11,
    },
  });
}
