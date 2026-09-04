import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
} from "@/constants/theme";
import { relativeTime } from "@/lib/utils";
import type {
  GitHubPullRequestFile,
  GitHubReviewComment,
} from "@/types/github.types";
import { Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface ReviewThread {
  root: GitHubReviewComment;
  replies: GitHubReviewComment[];
}

function groupThreadsByPath(
  comments: GitHubReviewComment[],
): Map<string, ReviewThread[]> {
  const byPath = new Map<string, GitHubReviewComment[]>();
  for (const comment of comments) {
    const list = byPath.get(comment.path) ?? [];
    list.push(comment);
    byPath.set(comment.path, list);
  }

  const result = new Map<string, ReviewThread[]>();
  for (const [path, list] of byPath) {
    const roots = list
      .filter((c) => !c.in_reply_to_id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    result.set(
      path,
      roots.map((root) => ({
        root,
        replies: list
          .filter((c) => c.in_reply_to_id === root.id)
          .sort((a, b) => a.created_at.localeCompare(b.created_at)),
      })),
    );
  }
  return result;
}

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
 * through MarkdownRenderer. Review threads are optional: pull requests pass
 * them, commit and compare views leave them empty.
 */
export function DiffFileList({
  files,
  reviewComments = [],
  colors,
  repoContext,
}: {
  files: GitHubPullRequestFile[];
  reviewComments?: GitHubReviewComment[];
  colors: ColorTokens;
  repoContext: string;
}) {
  const s = useMemo(() => buildStyles(colors), [colors]);
  const [sectionExpanded, setSectionExpanded] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const threadsByPath = useMemo(
    () => groupThreadsByPath(reviewComments),
    [reviewComments],
  );

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
          const threads = threadsByPath.get(file.filename) ?? [];

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
                {threads.length > 0 && (
                  <View style={s.commentBadge}>
                    <Octicons name="comment" size={10} color={colors.textMuted} />
                    <Text style={s.commentBadgeText}>{threads.length}</Text>
                  </View>
                )}
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

                  {threads.map((thread) => (
                    <View key={thread.root.id} style={s.threadCard}>
                      <ThreadComment comment={thread.root} colors={colors} s={s} />
                      {thread.replies.map((reply) => (
                        <View key={reply.id} style={s.threadReply}>
                          <ThreadComment comment={reply} colors={colors} s={s} />
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
    </View>
  );
}

function ThreadComment({
  comment,
  colors,
  s,
}: {
  comment: GitHubReviewComment;
  colors: ColorTokens;
  s: ReturnType<typeof buildStyles>;
}) {
  return (
    <View style={s.threadCommentRow}>
      <Image
        source={{ uri: comment.user.avatar_url }}
        style={s.threadAvatar}
        contentFit="cover"
        transition={100}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[s.rowText, { color: colors.textPrimary }]}>
            {comment.user.login}
          </Text>
          <Text style={s.commitMeta}>{relativeTime(comment.created_at)}</Text>
        </View>
        <Text style={[s.threadBody, { color: colors.textSecondary }]}>
          {comment.body}
        </Text>
      </View>
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
    commitMeta: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
      color: colors.textMuted,
    },
    diffStat: {
      fontFamily: FontFamily.mono,
      fontSize: 11,
    },
    commentBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: colors.surfaceSecondary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radius.full,
    },
    commentBadgeText: {
      fontFamily: FontFamily.medium,
      fontSize: 10,
      color: colors.textMuted,
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
    threadCard: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: Radius.md,
      padding: Spacing.sm,
      gap: Spacing.sm,
      backgroundColor: colors.background,
    },
    threadReply: {
      marginLeft: Spacing.md,
      paddingLeft: Spacing.sm,
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
    },
    threadCommentRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    threadAvatar: {
      width: 20,
      height: 20,
      borderRadius: 10,
      marginTop: 2,
    },
    threadBody: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      lineHeight: FontSize.caption * 1.4,
    },
  });
}
