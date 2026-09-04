import { ErrorBoundary } from "@/components";
import { DiffCommitList } from "@/components/repo/DiffCommitList";
import { DiffFileList } from "@/components/repo/DiffFileList";
import { ReactionsRow } from "@/components/repo/ReactionsRow";
import { ReviewThreadList } from "@/components/repo/ReviewThreadList";
import { TimelineEventRow } from "@/components/repo/TimelineEventRow";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import {
  type ColorTokens,
  FontFamily,
  FontSize,
  IconSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";
import {
  type CheckSummaryItem,
  useChecks,
  usePullRequestCommits,
  usePullRequestDetail,
  usePullRequestFiles,
  usePullRequestReviewComments,
  usePullRequestReviews,
  useRequestedReviewers,
} from "@/hooks/usePullRequestDetail";
import { useIssueComments, useIssueTimeline } from "@/hooks/useIssueDetail";
import { mergeCommentsWithTimeline } from "@/lib/timeline";
import { decodeRepoId, relativeTime } from "@/lib/utils";
import type {
  GitHubLabel,
  GitHubReview,
  GitHubReviewState,
  GitHubUserSummary,
} from "@/types/github.types";
import { Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function PullRequestDetailScreen() {
  return (
    <ErrorBoundary fallback="back">
      <PullRequestDetailScreenContent />
    </ErrorBoundary>
  );
}

function PullRequestDetailScreenContent() {
  const { repoId, number } = useLocalSearchParams<{
    repoId: string;
    number: string;
  }>();
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const prNumber = Number(number);

  const {
    data: pr,
    isLoading,
    isError,
  } = usePullRequestDetail(owner, repoName, prNumber);
  const { data: commentsData } = useIssueComments(owner, repoName, prNumber);
  const comments = useMemo(
    () => commentsData?.comments ?? [],
    [commentsData],
  );
  const { data: timelineEvents = [] } = useIssueTimeline(
    owner,
    repoName,
    prNumber,
  );
  const timeline = useMemo(
    () => mergeCommentsWithTimeline(comments, timelineEvents),
    [comments, timelineEvents],
  );

  const { data: reviewCommentsData } = usePullRequestReviewComments(
    owner,
    repoName,
    prNumber,
  );
  const reviewComments = reviewCommentsData?.comments ?? [];

  const { data: filesData } = usePullRequestFiles(owner, repoName, prNumber);
  const files = filesData?.files ?? [];

  const { data: reviews = [] } = usePullRequestReviews(
    owner,
    repoName,
    prNumber,
  );
  const { data: requestedReviewers } = useRequestedReviewers(
    owner,
    repoName,
    prNumber,
  );

  const { data: commits = [] } = usePullRequestCommits(
    owner,
    repoName,
    prNumber,
  );

  const { data: checks = [] } = useChecks(owner, repoName, pr?.head.sha ?? "");

  const isMerged = pr?.merged_at !== null;
  const isOpen = pr?.state === "open";

  let stateIcon: React.ComponentProps<typeof Octicons>["name"] =
    "git-pull-request";
  let stateColor: string = colors.success;

  if (pr?.draft) {
    stateIcon = "git-pull-request-draft";
    stateColor = colors.textMuted;
  } else if (isMerged) {
    stateIcon = "git-merge";
    stateColor = colors.merged;
  } else if (!isOpen) {
    stateIcon = "git-pull-request-closed";
    stateColor = colors.danger;
  }

  useEffect(() => {
    try {
      navigation.setOptions({ title: `#${prNumber}` });
    } catch {}
  }, [navigation, prNumber]);

  if (isLoading) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isError || !pr) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <Octicons name="alert" size={IconSize.xl} color={colors.danger} />
        <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>
          Failed to load pull request
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
        <Octicons name={stateIcon} size={22} color={stateColor} />
        <View style={{ flex: 1 }}>
          <Text
            style={[s.title, { color: colors.textPrimary }]}
            numberOfLines={5}
          >
            {pr.title}
          </Text>
          {pr.draft && (
            <View style={s.draftBadge}>
              <Text style={[s.draftText, { color: colors.textMuted }]}>
                Draft
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.branchRow}>
        <Octicons name="git-branch" size={12} color={colors.textMuted} />
        <Text style={[s.branchText, { color: colors.textSecondary }]}>
          {pr.base.ref} <Text style={{ color: colors.textMuted }}>←</Text>{" "}
          {pr.head.ref}
        </Text>
      </View>

      {pr.labels.length > 0 && (
        <View style={s.labelsRow}>
          {pr.labels.map((label: GitHubLabel) => (
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

      {checks.length > 0 && (
        <ChecksSection checks={checks} colors={colors} repoId={repoId} />
      )}

      <ReviewersSection
        reviews={reviews}
        requestedReviewers={requestedReviewers?.users ?? []}
        colors={colors}
      />

      <View style={s.authorBar}>
        <Image
          source={{ uri: pr.user.avatar_url }}
          style={s.authorAvatar}
          contentFit="cover"
          transition={100}
        />
        <Text style={[s.authorName, { color: colors.textPrimary }]}>
          {pr.user.login}
        </Text>
        <Text style={[s.authorTime, { color: colors.textMuted }]}>
          opened {relativeTime(pr.created_at)}
        </Text>
      </View>

      {pr.body && (
        <View
          style={[
            s.bodySection,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <MarkdownRenderer markdown={pr.body} />
        </View>
      )}

      {commits.length > 0 && (
        <DiffCommitList commits={commits} colors={colors} repoId={repoId} />
      )}

      {files.length > 0 && (
        <DiffFileList
          files={files}
          colors={colors}
          repoContext={`${owner}/${repoName}`}
        />
      )}

      {reviewComments.length > 0 && (
        <ReviewThreadList
          reviewComments={reviewComments}
          colors={colors}
          repoContext={`${owner}/${repoName}`}
        />
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
              <ReactionsRow reactions={item.comment.reactions} colors={colors} />
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

function getCheckDisplay(
  conclusion: CheckSummaryItem["conclusion"],
  colors: ColorTokens,
): { icon: React.ComponentProps<typeof Octicons>["name"]; color: string } {
  switch (conclusion) {
    case "success":
      return { icon: "check-circle-fill", color: colors.success };
    case "failure":
    case "error":
    case "timed_out":
    case "action_required":
      return { icon: "x-circle-fill", color: colors.danger };
    case "cancelled":
    case "skipped":
    case "neutral":
      return { icon: "skip", color: colors.textMuted };
    case "pending":
    default:
      return { icon: "clock", color: colors.warning };
  }
}

function ChecksSection({
  checks,
  colors,
  repoId,
}: {
  checks: CheckSummaryItem[];
  colors: ColorTokens;
  repoId: string;
}) {
  const s = useMemo(() => sectionStyles(colors), [colors]);
  const failing = checks.filter((c) => c.conclusion === "failure").length;
  const pending = checks.filter((c) => c.conclusion === "pending").length;

  const summary =
    failing > 0
      ? `${failing} failing`
      : pending > 0
        ? `${pending} pending`
        : "All checks passed";
  const summaryColor =
    failing > 0 ? colors.danger : pending > 0 ? colors.warning : colors.success;

  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Checks</Text>
        <Text style={[s.sectionMeta, { color: summaryColor }]}>{summary}</Text>
      </View>
      {checks.map((check) => {
        const display = getCheckDisplay(check.conclusion, colors);
        return (
          <Pressable
            key={check.key}
            style={({ pressed }) => [s.row, pressed && s.rowPressed]}
            onPress={() => {
              if (check.runId) {
                router.push({
                  pathname: "/(app)/repo/[repoId]/checks/[runId]",
                  params: { repoId, runId: String(check.runId) },
                });
              } else if (check.url) {
                Linking.openURL(check.url);
              }
            }}
            disabled={!check.runId && !check.url}
          >
            <Octicons name={display.icon} size={14} color={display.color} />
            <Text
              style={[s.rowText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {check.name}
            </Text>
            {check.runId ? (
              <Octicons name="chevron-right" size={14} color={colors.textMuted} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function getReviewStateDisplay(
  state: GitHubReviewState,
  colors: ColorTokens,
): { icon: React.ComponentProps<typeof Octicons>["name"]; color: string; label: string } {
  switch (state) {
    case "APPROVED":
      return { icon: "check-circle-fill", color: colors.success, label: "Approved" };
    case "CHANGES_REQUESTED":
      return { icon: "x-circle-fill", color: colors.danger, label: "Changes requested" };
    case "COMMENTED":
      return { icon: "comment", color: colors.textMuted, label: "Commented" };
    case "DISMISSED":
      return { icon: "circle-slash", color: colors.textMuted, label: "Dismissed" };
    case "PENDING":
    default:
      return { icon: "clock", color: colors.warning, label: "Pending" };
  }
}

interface ReviewerEntry {
  user: GitHubUserSummary;
  state: GitHubReviewState;
}

function buildReviewerEntries(
  reviews: GitHubReview[],
  requestedReviewers: GitHubUserSummary[],
): ReviewerEntry[] {
  const latestByUser = new Map<number, GitHubReview>();
  for (const review of reviews) {
    const existing = latestByUser.get(review.user.id);
    if (
      !existing ||
      (review.submitted_at ?? "") > (existing.submitted_at ?? "")
    ) {
      latestByUser.set(review.user.id, review);
    }
  }

  const entries: ReviewerEntry[] = Array.from(latestByUser.values()).map(
    (review) => ({ user: review.user, state: review.state }),
  );

  for (const user of requestedReviewers) {
    if (!latestByUser.has(user.id)) {
      entries.push({ user, state: "PENDING" });
    }
  }

  return entries;
}

function ReviewersSection({
  reviews,
  requestedReviewers,
  colors,
}: {
  reviews: GitHubReview[];
  requestedReviewers: GitHubUserSummary[];
  colors: ColorTokens;
}) {
  const s = useMemo(() => sectionStyles(colors), [colors]);
  const entries = useMemo(
    () => buildReviewerEntries(reviews, requestedReviewers),
    [reviews, requestedReviewers],
  );

  if (entries.length === 0) return null;

  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Reviewers</Text>
      </View>
      {entries.map((entry) => {
        const display = getReviewStateDisplay(entry.state, colors);
        return (
          <View key={entry.user.id} style={s.row}>
            <Image
              source={{ uri: entry.user.avatar_url }}
              style={s.reviewerAvatar}
              contentFit="cover"
              transition={100}
            />
            <Text
              style={[s.rowText, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {entry.user.login}
            </Text>
            <View style={s.statePill}>
              <Octicons name={display.icon} size={11} color={display.color} />
              <Text style={[s.stateText, { color: display.color }]}>
                {display.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function sectionStyles(colors: ColorTokens) {
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
    sectionMeta: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
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
    reviewerAvatar: {
      width: 22,
      height: 22,
      borderRadius: 11,
    },
    statePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    stateText: {
      fontFamily: FontFamily.medium,
      fontSize: 11,
    },
  });
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
  draftBadge: {
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    marginTop: Spacing.xs,
  },
  draftText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
  },

  branchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  branchText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.caption,
    flex: 1,
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
