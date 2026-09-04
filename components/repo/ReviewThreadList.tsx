import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
} from "@/constants/theme";
import { relativeTime } from "@/lib/utils";
import type { GitHubReviewComment } from "@/types/github.types";
import { Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

interface ReviewThread {
  path: string;
  line: number | null;
  diffHunk: string;
  root: GitHubReviewComment;
  replies: GitHubReviewComment[];
}

function buildThreads(comments: GitHubReviewComment[]): ReviewThread[] {
  const roots = comments
    .filter((c) => !c.in_reply_to_id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return roots.map((root) => ({
    path: root.path,
    line: root.line ?? root.original_line,
    diffHunk: root.diff_hunk,
    root,
    replies: comments
      .filter((c) => c.in_reply_to_id === root.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }));
}

/**
 * Flat, chronological list of PR review threads. Each thread carries its own
 * diff_hunk as context, so a reader doesn't need to expand the file diff and
 * hunt for the commented line.
 */
export function ReviewThreadList({
  reviewComments,
  colors,
  repoContext,
}: {
  reviewComments: GitHubReviewComment[];
  colors: ColorTokens;
  repoContext: string;
}) {
  const s = useMemo(() => buildStyles(colors), [colors]);
  const threads = useMemo(
    () => buildThreads(reviewComments),
    [reviewComments],
  );

  if (threads.length === 0) return null;

  return (
    <View style={s.container}>
      <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
        Review comments
      </Text>

      {threads.map((thread) => (
        <View
          key={thread.root.id}
          style={[
            s.threadCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={s.pathRow}>
            <Octicons name="diff" size={12} color={colors.textMuted} />
            <Text
              style={[s.pathText, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {thread.path}
              {thread.line ? `:${thread.line}` : ""}
            </Text>
          </View>

          <View style={s.hunkWrapper}>
            <MarkdownRenderer
              markdown={`\`\`\`diff\n${thread.diffHunk}\n\`\`\``}
              context={repoContext}
            />
          </View>

          <ThreadComment comment={thread.root} colors={colors} s={s} />
          {thread.replies.map((reply) => (
            <View key={reply.id} style={s.threadReply}>
              <ThreadComment comment={reply} colors={colors} s={s} />
            </View>
          ))}
        </View>
      ))}
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
    <View style={s.commentRow}>
      <Image
        source={{ uri: comment.user.avatar_url }}
        style={s.commentAvatar}
        contentFit="cover"
        transition={100}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[s.commentAuthor, { color: colors.textPrimary }]}>
            {comment.user.login}
          </Text>
          <Text style={[s.commentTime, { color: colors.textMuted }]}>
            {relativeTime(comment.created_at)}
          </Text>
        </View>
        <Text style={[s.commentBody, { color: colors.textSecondary }]}>
          {comment.body}
        </Text>
      </View>
    </View>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      gap: Spacing.sm,
    },
    sectionTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.label,
    },
    threadCard: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: Radius.lg,
      padding: Spacing.sm,
      gap: Spacing.sm,
    },
    pathRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    pathText: {
      flex: 1,
      fontFamily: FontFamily.mono,
      fontSize: 11,
    },
    hunkWrapper: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: Radius.md,
      overflow: "hidden",
    },
    commentRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    commentAvatar: {
      width: 20,
      height: 20,
      borderRadius: 10,
      marginTop: 2,
    },
    commentAuthor: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
    },
    commentTime: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
    },
    commentBody: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      lineHeight: FontSize.label * 1.4,
    },
    threadReply: {
      marginLeft: Spacing.md,
      paddingLeft: Spacing.sm,
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
    },
  });
}
