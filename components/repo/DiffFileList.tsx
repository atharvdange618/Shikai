import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
} from "@/constants/theme";
import type { GitHubPullRequestFile } from "@/types/github.types";
import { Octicons } from "@expo/vector-icons";
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

/**
 * Collapsible "N files changed" card that renders each file's unified diff
 * through MarkdownRenderer.
 */
export function DiffFileList({
  files,
  colors,
  repoContext,
}: {
  files: GitHubPullRequestFile[];
  colors: ColorTokens;
  repoContext: string;
}) {
  const s = useMemo(() => buildStyles(colors), [colors]);
  const [sectionExpanded, setSectionExpanded] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  const toggleFile = (filename: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) next.delete(filename);
      else next.add(filename);
      return next;
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
          const isExpanded = expandedFiles.has(file.filename);
          const display = getFileStatusDisplay(file.status, colors);

          return (
            <View key={file.filename}>
              <Pressable
                style={({ pressed }) => [s.row, pressed && s.rowPressed]}
                onPress={() => toggleFile(file.filename)}
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
              </Pressable>

              {isExpanded && (
                <View style={s.diffWrapper}>
                  {file.patch ? (
                    <MarkdownRenderer
                      markdown={`\`\`\`diff\n${file.patch}\n\`\`\``}
                      context={repoContext}
                    />
                  ) : (
                    <Text style={s.emptyDiffText}>
                      {file.status === "renamed"
                        ? "File renamed, no content changes."
                        : "Binary file or diff too large to display."}
                    </Text>
                  )}
                </View>
              )}
            </View>
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
    diffWrapper: {
      padding: Spacing.sm,
      gap: Spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    emptyDiffText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      fontStyle: "italic",
      padding: Spacing.sm,
    },
  });
}
