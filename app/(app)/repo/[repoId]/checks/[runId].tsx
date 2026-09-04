import { ErrorBoundary } from "@/components";
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
import { useCheckRun, useCheckRunAnnotations } from "@/hooks/useCheckRun";
import { decodeRepoId, relativeTime } from "@/lib/utils";
import type {
  GitHubCheckAnnotationLevel,
  GitHubCheckRunDetail,
} from "@/types/github.types";
import { Octicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CheckRunScreen() {
  return (
    <ErrorBoundary fallback="back">
      <CheckRunScreenContent />
    </ErrorBoundary>
  );
}

function CheckRunScreenContent() {
  const { repoId, runId } = useLocalSearchParams<{
    repoId: string;
    runId: string;
  }>();
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const id = Number(runId);

  const { data: run, isLoading, isError } = useCheckRun(owner, repoName, id);
  const { data: annotations = [] } = useCheckRunAnnotations(
    owner,
    repoName,
    id,
    (run?.output.annotations_count ?? 0) > 0,
  );

  useEffect(() => {
    try {
      navigation.setOptions({ title: run?.name ?? "Check" });
    } catch {}
  }, [navigation, run?.name]);

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
          Failed to load check
        </Text>
      </View>
    );
  }

  const status = getRunDisplay(run, colors);
  const summaryText = [run.output.title, run.output.summary, run.output.text]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join("\n\n");

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.titleRow}>
        <Octicons name={status.icon} size={22} color={status.color} />
        <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={4}>
          {run.name}
        </Text>
      </View>

      <Text style={[s.statusLine, { color: colors.textMuted }]}>
        <Text style={{ color: status.color }}>{status.label}</Text>
        {run.completed_at
          ? ` · finished ${relativeTime(run.completed_at)}`
          : ` · started ${relativeTime(run.started_at)}`}
      </Text>

      {summaryText.length > 0 && (
        <View
          style={[
            s.bodySection,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <MarkdownRenderer
            markdown={summaryText}
            context={`${owner}/${repoName}`}
          />
        </View>
      )}

      {annotations.length > 0 && (
        <View style={s.annotations}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
            Annotations ({annotations.length})
          </Text>
          {annotations.map((a, index) => {
            const level = getLevelDisplay(a.annotation_level, colors);
            const lineLabel =
              a.start_line === a.end_line
                ? `${a.path}:${a.start_line}`
                : `${a.path}:${a.start_line}-${a.end_line}`;
            return (
              <View
                key={`${a.path}-${a.start_line}-${index}`}
                style={[
                  s.annotationCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={s.annotationHeader}>
                  <Octicons name={level.icon} size={13} color={level.color} />
                  <Text
                    style={[s.annotationPath, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {lineLabel}
                  </Text>
                </View>
                {a.title ? (
                  <Text
                    style={[s.annotationTitle, { color: colors.textPrimary }]}
                  >
                    {a.title}
                  </Text>
                ) : null}
                <Text style={[s.annotationMessage, { color: colors.textSecondary }]}>
                  {a.message}
                </Text>
                {a.raw_details ? (
                  <Text style={[s.annotationRaw, { color: colors.textMuted }]}>
                    {a.raw_details}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      <Pressable
        onPress={() => Linking.openURL(run.details_url ?? run.html_url)}
        style={({ pressed }) => [
          s.linkButton,
          {
            backgroundColor: colors.surfaceSecondary,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Octicons name="link-external" size={13} color={colors.textSecondary} />
        <Text style={[s.linkButtonText, { color: colors.textSecondary }]}>
          Open full logs on GitHub
        </Text>
      </Pressable>

      <View style={{ height: Spacing.xxl + 60 + Spacing.lg }} />
    </ScrollView>
  );
}

function getRunDisplay(
  run: GitHubCheckRunDetail,
  colors: ColorTokens,
): { icon: React.ComponentProps<typeof Octicons>["name"]; color: string; label: string } {
  if (run.status !== "completed") {
    return { icon: "clock", color: colors.warning, label: "In progress" };
  }
  switch (run.conclusion) {
    case "success":
      return { icon: "check-circle-fill", color: colors.success, label: "Passed" };
    case "failure":
    case "timed_out":
    case "action_required":
      return { icon: "x-circle-fill", color: colors.danger, label: "Failed" };
    case "cancelled":
    case "skipped":
    case "neutral":
      return { icon: "skip", color: colors.textMuted, label: "Skipped" };
    default:
      return { icon: "dot-fill", color: colors.textMuted, label: "Completed" };
  }
}

function getLevelDisplay(
  level: GitHubCheckAnnotationLevel,
  colors: ColorTokens,
): { icon: React.ComponentProps<typeof Octicons>["name"]; color: string } {
  switch (level) {
    case "failure":
      return { icon: "x-circle-fill", color: colors.danger };
    case "warning":
      return { icon: "alert", color: colors.warning };
    case "notice":
    default:
      return { icon: "info", color: colors.accent };
  }
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
  bodySection: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  annotations: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
  },
  annotationCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  annotationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  annotationPath: {
    flex: 1,
    fontFamily: FontFamily.mono,
    fontSize: 11,
  },
  annotationTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.label,
  },
  annotationMessage: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    lineHeight: FontSize.caption * 1.5,
  },
  annotationRaw: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    lineHeight: 15,
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
