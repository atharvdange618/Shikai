import { ErrorBoundary } from "@/components";
import { TimelineEventRow } from "@/components/repo/TimelineEventRow";
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
import {
  useIssueComments,
  useIssueDetail,
  useIssueTimeline,
} from "@/hooks/useIssueDetail";
import { mergeCommentsWithTimeline } from "@/lib/timeline";
import { decodeRepoId, encodeRepoId, relativeTime } from "@/lib/utils";
import type { GitHubLabel } from "@/types/github.types";
import { Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function IssueDetailScreen() {
  return (
    <ErrorBoundary fallback="back">
      <IssueDetailScreenContent />
    </ErrorBoundary>
  );
}

function IssueDetailScreenContent() {
  const { repoId, number } = useLocalSearchParams<{
    repoId: string;
    number: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const issueNumber = Number(number);

  const {
    data: issue,
    isLoading,
    isError,
  } = useIssueDetail(owner, repoName, issueNumber);
  const { data: commentsData } = useIssueComments(owner, repoName, issueNumber);
  const comments = useMemo(
    () => commentsData?.comments ?? [],
    [commentsData],
  );
  const { data: timelineEvents = [] } = useIssueTimeline(
    owner,
    repoName,
    issueNumber,
  );
  const timeline = useMemo(
    () => mergeCommentsWithTimeline(comments, timelineEvents),
    [comments, timelineEvents],
  );

  const isOpen = issue?.state === "open";
  const stateColor = isOpen ? colors.success : colors.textMuted;

  useEffect(() => {
    try {
      navigation.setOptions({ title: `#${issueNumber}` });
    } catch {}
  }, [navigation, issueNumber]);

  if (isLoading) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isError || !issue) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <Octicons name="alert" size={IconSize.xl} color={colors.danger} />
        <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>
          Failed to load issue
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.titleRow}>
        <Octicons
          name={isOpen ? "issue-opened" : "issue-closed"}
          size={22}
          color={stateColor}
        />
        <Text
          style={[s.title, { color: colors.textPrimary }]}
          numberOfLines={5}
        >
          {issue.title}
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

      {issue.labels.length > 0 && (
        <View style={s.labelsRow}>
          {issue.labels.map((label: GitHubLabel) => (
            <View
              key={label.id}
              style={[
                s.labelPill,
                {
                  backgroundColor: `#${label.color}20`,
                },
              ]}
            >
              <Text style={[s.labelText, { color: `#${label.color}` }]}>
                {label.name}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={s.authorBar}>
        <Image
          source={{ uri: issue.user.avatar_url }}
          style={s.authorAvatar}
          contentFit="cover"
          transition={100}
        />
        <Text style={[s.authorName, { color: colors.textPrimary }]}>
          {issue.user.login}
        </Text>
        <Text style={[s.authorTime, { color: colors.textMuted }]}>
          opened {relativeTime(issue.created_at)}
        </Text>
      </View>

      {issue.body && (
        <View
          style={[
            s.bodySection,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <MarkdownRenderer markdown={issue.body} />
        </View>
      )}

      {timeline.length > 0 && (
        <View style={[s.separator, { backgroundColor: colors.border }]} />
      )}

      {timeline.map((item, index) =>
        item.kind === "comment" ? (
          <View key={`comment-${item.comment.id}`}>
            <View
              style={[
                s.commentCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={s.commentHeader}>
                <Image
                  source={{ uri: item.comment.user.avatar_url }}
                  style={s.commentAvatar}
                  contentFit="cover"
                  transition={100}
                />
                <Text style={[s.commentAuthor, { color: colors.textPrimary }]}>
                  {item.comment.user.login}
                </Text>
                <Text style={[s.commentTime, { color: colors.textMuted }]}>
                  {relativeTime(item.comment.created_at)}
                </Text>
              </View>
              <MarkdownRenderer markdown={item.comment.body} />
            </View>
          </View>
        ) : (
          <TimelineEventRow
            key={`event-${item.created_at}-${index}`}
            event={item.event}
            colors={colors}
            currentRepoFullName={`${owner}/${repoName}`}
          />
        ),
      )}

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

  labelsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  labelPill: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
  },
  labelText: {
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

  commentCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
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
});
