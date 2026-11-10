import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PRHeader } from "@/components/repo/PRHeader";
import { PRGitHubLink, PRPageState, prStyles as s } from "@/components/repo/PRList";
import { ReactionsRow } from "@/components/repo/ReactionsRow";
import { TimelineEventRow } from "@/components/repo/TimelineEventRow";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { BorderWidth, FontFamily, FontSize, Radius, Spacing, useTheme } from "@/constants/theme";
import {
  useChecks,
  usePullRequestConversation,
  usePullRequestActivity,
  usePullRequestDetail,
  usePullRequestReviewComments,
  usePullRequestReviews,
  useRequestedReviewers,
} from "@/hooks/usePullRequestDetail";
import { buildThreads, checksSummary, checksIcon, latestReviews } from "@/lib/pr-review";
import { mergeCommentsWithTimeline } from "@/lib/timeline";
import { decodeRepoId, relativeTime } from "@/lib/utils";
import type { GitHubComment } from "@/types/github.types";
import { Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

export default function PullRequestDetailScreen() {
  return (
    <ErrorBoundary fallback="back">
      <Overview />
    </ErrorBoundary>
  );
}

function Overview() {
  const { repoId, number } = useLocalSearchParams<{
    repoId: string;
    number: string;
  }>();
  const [owner, repo] = decodeRepoId(repoId);
  const { colors } = useTheme();
  const detail = usePullRequestDetail(owner, repo, Number(number));
  const pr = detail.data;
  const comments = usePullRequestConversation(owner, repo, Number(number));
  const activity = usePullRequestActivity(owner, repo, Number(number));
  const reviews = usePullRequestReviews(owner, repo, Number(number));
  const requested = useRequestedReviewers(owner, repo, Number(number));
  const threads = usePullRequestReviewComments(owner, repo, Number(number));
  const checks = useChecks(owner, repo, pr?.head.sha ?? "");
  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = reviews;
  // A later review can reverse an earlier decision, so summaries need every page.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isError) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage]);
  const reviewStates = latestReviews(reviews.reviews);
  const approvals = reviewStates.filter((review) => review.state === "APPROVED").length;
  const changes = reviewStates.filter((review) => review.state === "CHANGES_REQUESTED").length;
  const pendingReviewers =
    (requested.data?.users.length ?? 0) + (requested.data?.teams.length ?? 0);
  const reviewSummary =
    reviews.isError || requested.isError
      ? "Review status unavailable"
      : reviews.isLoading || reviews.hasNextPage || requested.isLoading
        ? "Loading review status…"
        : changes
          ? `${changes} requesting changes · ${approvals} approved`
          : `${approvals} approved · ${pendingReviewers} awaiting review`;
  const checkSummary = checksSummary(
    checks.data,
    checks.isLoading,
    checks.isError,
    Boolean(checks.hasNextPage),
  );
  const threadCount = buildThreads(threads.comments).length;
  const timeline = mergeCommentsWithTimeline(comments.items, activity.items);
  const state = pr?.draft
    ? "Draft"
    : pr?.merged_at
      ? "Merged"
      : pr?.state === "open"
        ? "Open"
        : "Closed";
  const stateColor =
    state === "Merged"
      ? colors.merged
      : state === "Open"
        ? colors.success
        : state === "Closed"
          ? colors.danger
          : colors.textMuted;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <PRHeader title="PR overview" repoId={repoId} number={number} />
      {detail.isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : !pr ? (
        <PRPageState
          {...detail}
          count={0}
          isFetchingNextPage={false}
          fetchNextPage={detail.refetch}
          emptyText="Pull request unavailable"
        />
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={[s.meta, { color: stateColor }]}>{state} pull request</Text>
          <Text style={[s.title, { color: colors.textPrimary, fontSize: FontSize.heading }]}>
            {pr.title}
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              gap: Spacing.sm,
            }}
          >
            <Image
              source={{ uri: pr.user.avatar_url }}
              style={{ width: 24, height: 24, borderRadius: 12 }}
            />
            <Text style={[s.meta, { color: colors.textSecondary }]}>
              {pr.user.login} opened {relativeTime(pr.created_at)}
            </Text>
          </View>
          <Text style={[s.mono, { color: colors.textSecondary }]}>
            {pr.base.ref} ← {pr.head.ref}
          </Text>
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.text, { color: colors.textPrimary }]}>{checkSummary}</Text>
            <Text style={[s.text, { color: colors.textSecondary }]}>{reviewSummary}</Text>
            {(reviews.isError || requested.isError) && (
              <Pressable
                accessibilityRole="button"
                style={s.button}
                onPress={() => {
                  void reviews.refetch();
                  void requested.refetch();
                }}
              >
                <Text style={[s.text, { color: colors.accent }]}>Retry review status</Text>
              </Pressable>
            )}
          </View>
          <Text style={[s.title, { color: colors.textPrimary }]}>Explore this pull request</Text>
          <View
            style={{
              borderWidth: BorderWidth.normal,
              borderColor: colors.border,
              borderRadius: Radius.md,
              overflow: "hidden",
            }}
          >
            <SectionRow
              title="Files changed"
              icon="diff"
              subtitle={`+${pr.additions.toLocaleString()} additions · −${pr.deletions.toLocaleString()} deletions`}
              subtitleNode={
                <>
                  <Text style={{ color: colors.success }}>+{pr.additions.toLocaleString()}</Text>
                  {" additions · "}
                  <Text style={{ color: colors.danger }}>−{pr.deletions.toLocaleString()}</Text>
                  {" deletions"}
                </>
              }
              count={String(pr.changed_files)}
              onPress={() =>
                router.push({
                  pathname: "/(app)/repo/[repoId]/pr/[number]/files",
                  params: { repoId, number },
                })
              }
            />
            <SectionRow
              title="Review threads"
              icon="comment-discussion"
              subtitle="Code comments and replies"
              count={
                threads.isLoading
                  ? "Loading…"
                  : threads.isError
                    ? "Unavailable"
                    : `${threadCount}${threads.hasNextPage ? "+ loaded" : ""}`
              }
              onPress={() =>
                router.push({
                  pathname: "/(app)/repo/[repoId]/pr/[number]/reviews",
                  params: { repoId, number },
                })
              }
            />
            <SectionRow
              title="Commits"
              icon="git-commit"
              subtitle="History of this pull request"
              count={String(pr.commits)}
              onPress={() =>
                router.push({
                  pathname: "/(app)/repo/[repoId]/pr/[number]/commits",
                  params: { repoId, number },
                })
              }
            />
            <SectionRow
              title="Checks"
              icon={checksIcon(
                checks.data,
                checks.isLoading,
                checks.isError,
                Boolean(checks.hasNextPage),
              )}
              subtitle={checkSummary}
              onPress={() =>
                router.push({
                  pathname: "/(app)/repo/[repoId]/pr/[number]/checks",
                  params: { repoId, number },
                })
              }
            />
          </View>
          {pr.labels.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: Spacing.sm,
              }}
            >
              {pr.labels.map((label) => (
                <View
                  key={label.id}
                  style={{
                    borderRadius: Radius.full,
                    paddingHorizontal: Spacing.sm + 2,
                    paddingVertical: 3,
                    backgroundColor: `#${label.color}20`,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FontFamily.medium,
                      fontSize: FontSize.caption,
                      color: `#${label.color}`,
                    }}
                  >
                    {label.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <Text style={[s.title, { color: colors.textPrimary }]}>Description</Text>
          {pr.body ? (
            <MarkdownRenderer markdown={pr.body} context={`${owner}/${repo}`} />
          ) : (
            <Text style={[s.text, { color: colors.textSecondary }]}>No description provided.</Text>
          )}
          <Text style={[s.title, { color: colors.textPrimary }]}>Conversation &amp; activity</Text>
          {(comments.isLoading || activity.isLoading) && (
            <ActivityIndicator color={colors.accent} />
          )}
          {(comments.isError || activity.isError) && (
            <Pressable
              accessibilityRole="button"
              style={s.button}
              onPress={() => {
                void comments.refetch();
                void activity.refetch();
              }}
            >
              <Text style={[s.text, { color: colors.accent }]}>
                Conversation partly unavailable · Retry
              </Text>
            </Pressable>
          )}
          {timeline.map((item, index) =>
            item.kind === "comment" ? (
              <ConversationComment
                key={`comment-${item.comment.id}`}
                comment={item.comment}
                context={`${owner}/${repo}`}
              />
            ) : (
              <TimelineEventRow
                key={`event-${item.created_at}-${index}`}
                event={item.event}
                colors={colors}
                currentRepoFullName={`${owner}/${repo}`}
              />
            ),
          )}
          {(comments.hasNextPage || activity.hasNextPage) && (
            <Pressable
              accessibilityRole="button"
              style={s.button}
              disabled={comments.isFetchingNextPage || activity.isFetchingNextPage}
              onPress={() => {
                if (comments.hasNextPage) void comments.fetchNextPage();
                if (activity.hasNextPage) void activity.fetchNextPage();
              }}
            >
              <Text style={[s.text, { color: colors.accent }]}>
                {comments.isFetchingNextPage || activity.isFetchingNextPage
                  ? "Loading conversation…"
                  : "Load more conversation & activity"}
              </Text>
            </Pressable>
          )}
          <PRGitHubLink url={pr.html_url} />
        </ScrollView>
      )}
    </View>
  );
}

function SectionRow({
  title,
  subtitle,
  subtitleNode,
  count,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  /** Rendered in place of `subtitle` when part of the line needs its own color. */
  subtitleNode?: React.ReactNode;
  count?: string;
  icon: React.ComponentProps<typeof Octicons>["name"];
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, count, subtitle].filter(Boolean).join(", ")}
      style={({ pressed }) => [
        s.row,
        {
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.md,
          borderColor: colors.border,
          backgroundColor: pressed ? colors.surfaceSecondary : colors.background,
        },
      ]}
    >
      <Octicons name={icon} size={20} color={colors.textSecondary} />
      <View style={{ flex: 1, gap: Spacing.xs }}>
        <Text style={[s.text, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[s.meta, { color: colors.textSecondary }]}>{subtitleNode ?? subtitle}</Text>
      </View>
      {count && (
        <Text style={[s.meta, { color: colors.textSecondary, maxWidth: "30%" }]}>{count}</Text>
      )}
      <Octicons name="chevron-right" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

function ConversationComment({ comment, context }: { comment: GitHubComment; context: string }) {
  const { colors } = useTheme();
  const bot = comment.user.type === "Bot" || comment.user.login.endsWith("[bot]");
  const [expanded, setExpanded] = useState(!bot);
  const title =
    comment.body
      .split("\n")
      .find((line) => line.trim() && !line.startsWith("<!--"))
      ?.replace(/^#+\s*/, "")
      .slice(0, 160) ?? "Bot report";
  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[s.text, { color: colors.textPrimary }]}>
        {comment.user.login} · {relativeTime(comment.created_at)}
      </Text>
      {bot && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          style={s.button}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={[s.text, { color: colors.accent }]}>
            {expanded ? "Hide" : "Show"} report · {title}
          </Text>
        </Pressable>
      )}
      {expanded && <MarkdownRenderer markdown={comment.body} context={context} />}
      <ReactionsRow reactions={comment.reactions} colors={colors} />
    </View>
  );
}
