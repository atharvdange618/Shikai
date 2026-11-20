import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import { useWorkflowRun, useWorkflowRunJobs } from "@/hooks/useActions";
import { parseCheckRunId } from "@/lib/github-rest";
import { getRunDisplay } from "@/lib/run-display";
import { decodeRepoId, formatDuration, relativeTime } from "@/lib/utils";
import type { GitHubWorkflowJob } from "@/types/github.types";
import { Octicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export default function WorkflowRunScreen() {
  return (
    <ErrorBoundary fallback="back">
      <WorkflowRunScreenContent />
    </ErrorBoundary>
  );
}

function WorkflowRunScreenContent() {
  const { repoId, runId, attempt } = useLocalSearchParams<{
    repoId: string;
    runId: string;
    attempt?: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const id = Number(runId);
  const attemptNumber = Number(attempt);
  const requestedAttempt =
    Number.isSafeInteger(attemptNumber) && attemptNumber > 0 ? attemptNumber : undefined;

  const { data: run, isLoading, isError } = useWorkflowRun(owner, repoName, id, requestedAttempt);
  const {
    items: jobs,
    isLoading: isJobsLoading,
    isError: isJobsError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchJobs,
  } = useWorkflowRunJobs(owner, repoName, id, requestedAttempt ?? run?.run_attempt);

  useEffect(() => {
    try {
      navigation.setOptions({
        title: run ? `${run.name ?? "Workflow"} #${run.run_number}` : "Run",
      });
    } catch {}
  }, [navigation, run]);

  if (isLoading) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isError || !run) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <Octicons name="alert" size={IconSize.xl} color={colors.danger} />
        <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>
          Failed to load workflow run
        </Text>
      </View>
    );
  }

  const status = getRunDisplay(run.status, run.conclusion, colors);
  const startedAt = run.run_started_at ?? run.created_at;
  const finished = run.status === "completed";

  const openJob = (job: GitHubWorkflowJob) => {
    const checkRunId = parseCheckRunId(job.check_run_url);
    if (checkRunId) {
      router.push({
        pathname: "/(app)/repo/[repoId]/checks/[runId]",
        params: { repoId: repoId ?? "", runId: String(checkRunId) },
      });
    } else if (job.html_url) {
      WebBrowser.openBrowserAsync(job.html_url).catch(() =>
        console.error("Could not open browser"),
      );
    }
  };

  return (
    <FlashList
      style={[s.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      data={jobs}
      keyExtractor={(job) => String(job.id)}
      renderItem={({ item: job }) => {
        const jobStatus = getRunDisplay(job.status, job.conclusion, colors);
        return (
          <Pressable
            onPress={() => openJob(job)}
            accessibilityRole="button"
            accessibilityLabel={`${job.name}, ${jobStatus.label}`}
            style={({ pressed }) => [
              s.jobRow,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Octicons name={jobStatus.icon} size={16} color={jobStatus.color} />
            <Text style={[s.jobName, { color: colors.textPrimary }]} numberOfLines={2}>
              {job.name}
            </Text>
            {job.status !== "queued" && (
              <Text style={[s.jobDuration, { color: colors.textMuted }]}>
                {formatDuration(job.started_at, job.completed_at)}
              </Text>
            )}
            <Octicons name="chevron-right" size={12} color={colors.textMuted} />
          </Pressable>
        );
      }}
      ListHeaderComponent={
        <View style={s.header}>
          <View style={s.titleRow}>
            <Octicons name={status.icon} size={22} color={status.color} />
            <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={4}>
              {run.display_title}
            </Text>
          </View>

          <Text style={[s.statusLine, { color: colors.textMuted }]}>
            <Text style={{ color: status.color }}>{status.label}</Text>
            {finished
              ? ` · took ${formatDuration(startedAt, run.updated_at)} · ${relativeTime(run.updated_at)}`
              : ` · started ${relativeTime(startedAt)}`}
            {` · Attempt ${run.run_attempt}`}
          </Text>

          <View
            style={[s.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {run.head_branch && (
              <MetaRow icon="git-branch" colors={colors} mono>
                {run.head_branch}
              </MetaRow>
            )}
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(app)/repo/[repoId]/commit/[sha]",
                  params: { repoId: repoId ?? "", sha: run.head_sha },
                })
              }
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <MetaRow icon="git-commit" colors={colors} mono accent>
                {run.head_sha.slice(0, 7)}
              </MetaRow>
            </Pressable>
            <MetaRow icon="zap" colors={colors}>
              {run.event}
              {run.actor ? ` by ${run.actor.login}` : ""}
            </MetaRow>
          </View>

          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
            Jobs{jobs.length > 0 ? ` (${jobs.length})` : ""}
          </Text>
        </View>
      }
      ListFooterComponent={
        <View>
          {(isJobsLoading || isFetchingNextPage) && (
            <ActivityIndicator
              size="small"
              color={colors.accent}
              accessibilityLabel="Loading jobs"
            />
          )}
          {isJobsError && (
            <Text style={[s.statusLine, { color: colors.danger }]}>
              {jobs.length > 0 ? "Failed to load more jobs" : "Failed to load jobs"}
            </Text>
          )}
          {!isJobsLoading && !isJobsError && jobs.length === 0 && !hasNextPage && (
            <Text style={[s.statusLine, { color: colors.textMuted }]}>No jobs yet</Text>
          )}
          {!isFetchingNextPage && (hasNextPage || isJobsError) && (
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [s.linkButton, pressed && { opacity: 0.6 }]}
              onPress={() => void (hasNextPage ? fetchNextPage() : refetchJobs())}
            >
              <Text style={[s.linkButtonText, { color: colors.accent }]}>
                {isJobsError ? "Retry jobs" : "Load more jobs"}
              </Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="link"
            onPress={() => WebBrowser.openBrowserAsync(run.html_url)}
            style={({ pressed }) => [s.linkButton, pressed && { opacity: 0.6 }]}
          >
            <Octicons name="link-external" size={14} color={colors.accent} />
            <Text style={[s.linkButtonText, { color: colors.accent }]}>View on GitHub</Text>
          </Pressable>
        </View>
      }
    />
  );
}

function MetaRow({
  icon,
  colors,
  mono,
  accent,
  children,
}: {
  icon: React.ComponentProps<typeof Octicons>["name"];
  colors: ColorTokens;
  mono?: boolean;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={s.metaRow}>
      <Octicons name={icon} size={14} color={colors.textMuted} />
      <Text
        style={[
          s.metaText,
          mono && { fontFamily: FontFamily.mono },
          { color: accent ? colors.accent : colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {children}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: {
    flex: 1,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },
  content: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl + 60 + Spacing.lg,
  },
  header: {
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
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
  statusLine: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },
  metaCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  metaText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.sm,
  },
  jobName: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
  },
  jobDuration: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    minHeight: 48,
    borderRadius: Radius.md,
  },
  linkButtonText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
  },
});
