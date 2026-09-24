import { ErrorBoundary } from "@/components";
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
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function WorkflowRunScreen() {
  return (
    <ErrorBoundary fallback="back">
      <WorkflowRunScreenContent />
    </ErrorBoundary>
  );
}

function WorkflowRunScreenContent() {
  const { repoId, runId } = useLocalSearchParams<{
    repoId: string;
    runId: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const id = Number(runId);

  const { data: run, isLoading, isError } = useWorkflowRun(owner, repoName, id);
  const {
    data: jobs = [],
    isLoading: isJobsLoading,
    isError: isJobsError,
  } = useWorkflowRunJobs(owner, repoName, id);

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
      WebBrowser.openBrowserAsync(job.html_url);
    }
  };

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
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
      </Text>

      <View
        style={[
          s.metaCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
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

      <View style={s.jobs}>
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
          Jobs{jobs.length > 0 ? ` (${jobs.length})` : ""}
        </Text>

        {isJobsLoading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : isJobsError ? (
          <Text style={[s.statusLine, { color: colors.danger }]}>
            Failed to load jobs
          </Text>
        ) : jobs.length === 0 ? (
          <Text style={[s.statusLine, { color: colors.textMuted }]}>
            No jobs yet
          </Text>
        ) : (
          jobs.map((job) => {
            const jobStatus = getRunDisplay(job.status, job.conclusion, colors);
            return (
              <Pressable
                key={job.id}
                onPress={() => openJob(job)}
                accessibilityLabel={`${job.name}, ${jobStatus.label}`}
                style={({ pressed }) => [
                  s.jobRow,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Octicons name={jobStatus.icon} size={16} color={jobStatus.color} />
                <Text
                  style={[s.jobName, { color: colors.textPrimary }]}
                  numberOfLines={2}
                >
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
          })
        )}
      </View>

      <Pressable
        onPress={() => WebBrowser.openBrowserAsync(run.html_url)}
        style={({ pressed }) => [s.linkButton, pressed && { opacity: 0.6 }]}
      >
        <Octicons name="link-external" size={14} color={colors.accent} />
        <Text style={[s.linkButtonText, { color: colors.accent }]}>
          View on GitHub
        </Text>
      </Pressable>
    </ScrollView>
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
  jobs: {
    gap: Spacing.sm,
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
    borderRadius: Radius.md,
  },
  linkButtonText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
  },
});
