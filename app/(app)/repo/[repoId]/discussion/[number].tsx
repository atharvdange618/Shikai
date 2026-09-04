import { ErrorBoundary } from "@/components";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import {
  FontFamily,
  FontSize,
  IconSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";
import { useDiscussionDetail } from "@/hooks/useDiscussions";
import { decodeRepoId, encodeRepoId, relativeTime } from "@/lib/utils";
import type { DiscussionComment } from "@/types/github-graphql.types";
import { Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function DiscussionDetailScreen() {
  return (
    <ErrorBoundary fallback="back">
      <DiscussionDetailScreenContent />
    </ErrorBoundary>
  );
}

function DiscussionDetailScreenContent() {
  const { repoId, number } = useLocalSearchParams<{
    repoId: string;
    number: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const discussionNumber = Number(number);

  const {
    data: discussion,
    isLoading,
    isError,
  } = useDiscussionDetail(owner, repoName, discussionNumber);

  useEffect(() => {
    try {
      navigation.setOptions({ title: `#${discussionNumber}` });
    } catch {}
  }, [navigation, discussionNumber]);

  if (isLoading) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isError || !discussion) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <Octicons name="alert" size={IconSize.xl} color={colors.danger} />
        <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>
          Failed to load discussion
        </Text>
      </View>
    );
  }

  const comments = discussion.comments.nodes;
  const markdownContext = `${owner}/${repoName}`;

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.titleRow}>
        <Octicons
          name="comment-discussion"
          size={22}
          color={discussion.isAnswered ? colors.success : colors.textMuted}
        />
        <Text
          style={[s.title, { color: colors.textPrimary }]}
          numberOfLines={5}
        >
          {discussion.title}
        </Text>
      </View>

      <Pressable
        onPress={() => {
          const id = encodeRepoId(owner, repoName);
          router.push(`/(app)/repo/${id}`);
        }}
        style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={[s.repoLink, { color: colors.accent }]}>
          {owner}/{repoName}
        </Text>
      </Pressable>

      <View style={s.badgeRow}>
        <View
          style={[s.categoryPill, { backgroundColor: colors.surfaceSecondary }]}
        >
          <Text style={[s.categoryText, { color: colors.textSecondary }]}>
            {discussion.category.emoji} {discussion.category.name}
          </Text>
        </View>
        {discussion.isAnswered && (
          <View
            style={[
              s.answeredPill,
              { backgroundColor: `${colors.success}20` },
            ]}
          >
            <Octicons name="check" size={11} color={colors.success} />
            <Text style={[s.answeredText, { color: colors.success }]}>
              Answered
            </Text>
          </View>
        )}
      </View>

      <View style={s.authorBar}>
        {discussion.author?.avatarUrl ? (
          <Image
            source={{ uri: discussion.author.avatarUrl }}
            style={s.authorAvatar}
            contentFit="cover"
            transition={100}
          />
        ) : null}
        <Text style={[s.authorName, { color: colors.textPrimary }]}>
          {discussion.author?.login ?? "ghost"}
        </Text>
        <Text style={[s.authorTime, { color: colors.textMuted }]}>
          started {relativeTime(discussion.createdAt)}
        </Text>
      </View>

      {discussion.body && (
        <View
          style={[
            s.bodySection,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <MarkdownRenderer markdown={discussion.body} context={markdownContext} />
        </View>
      )}

      {comments.length > 0 && (
        <View style={[s.separator, { backgroundColor: colors.border }]} />
      )}

      {comments.map((comment: DiscussionComment) => (
        <View key={comment.id} style={s.commentGroup}>
          <View
            style={[
              s.commentCard,
              {
                backgroundColor: colors.surface,
                borderColor: comment.isAnswer ? colors.success : colors.border,
              },
            ]}
          >
            <View style={s.commentHeader}>
              {comment.author?.avatarUrl ? (
                <Image
                  source={{ uri: comment.author.avatarUrl }}
                  style={s.commentAvatar}
                  contentFit="cover"
                  transition={100}
                />
              ) : null}
              <Text style={[s.commentAuthor, { color: colors.textPrimary }]}>
                {comment.author?.login ?? "ghost"}
              </Text>
              <Text style={[s.commentTime, { color: colors.textMuted }]}>
                {relativeTime(comment.createdAt)}
              </Text>
              {comment.isAnswer && (
                <View
                  style={[
                    s.answerBadge,
                    { backgroundColor: `${colors.success}20` },
                  ]}
                >
                  <Octicons name="check" size={10} color={colors.success} />
                  <Text style={[s.answerBadgeText, { color: colors.success }]}>
                    Answer
                  </Text>
                </View>
              )}
            </View>
            <MarkdownRenderer markdown={comment.body} context={markdownContext} />
          </View>

          {comment.replies.nodes.map((reply) => (
            <View
              key={reply.id}
              style={[
                s.replyCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={s.commentHeader}>
                {reply.author?.avatarUrl ? (
                  <Image
                    source={{ uri: reply.author.avatarUrl }}
                    style={s.commentAvatar}
                    contentFit="cover"
                    transition={100}
                  />
                ) : null}
                <Text style={[s.commentAuthor, { color: colors.textPrimary }]}>
                  {reply.author?.login ?? "ghost"}
                </Text>
                <Text style={[s.commentTime, { color: colors.textMuted }]}>
                  {relativeTime(reply.createdAt)}
                </Text>
              </View>
              <MarkdownRenderer markdown={reply.body} context={markdownContext} />
            </View>
          ))}
        </View>
      ))}

      <View style={{ height: Spacing.xxl + 60 + Spacing.lg }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl + 60 + Spacing.lg,
    gap: Spacing.md,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  emptyTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading,
    lineHeight: FontSize.heading * 1.35,
  },

  repoLink: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flexWrap: "wrap",
  },
  categoryPill: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
  },
  categoryText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
  },
  answeredPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
  },
  answeredText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
  },

  authorBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  authorName: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
  },
  authorTime: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },

  bodySection: {
    marginTop: Spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.sm,
  },

  commentGroup: {
    gap: Spacing.sm,
  },
  commentCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  replyCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    marginLeft: Spacing.lg,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  commentAuthor: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
  },
  commentTime: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },
  answerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    marginLeft: "auto",
  },
  answerBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
  },
});
