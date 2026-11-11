import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PRHeader } from "@/components/repo/PRHeader";
import { PRGitHubLink, PRList, PRPageState, prStyles as s } from "@/components/repo/PRList";
import { FontFamily, Layout, Radius, Spacing, useTheme } from "@/constants/theme";
import {
  useChecks,
  usePullRequestDetail,
  type CheckSummaryItem,
} from "@/hooks/usePullRequestDetail";
import { isSafeExternalUrl } from "@/lib/markdown-links";
import { CHECK_GROUPS, checkGroup, checksSummary, type CheckGroup } from "@/lib/pr-review";
import { getCheckDisplay } from "@/lib/run-display";
import { decodeRepoId, formatDuration, relativeTime } from "@/lib/utils";
import { Octicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

type Row =
  { kind: "group"; group: CheckGroup; count: number } | { kind: "check"; check: CheckSummaryItem };
export default function ChecksScreen() {
  return (
    <ErrorBoundary fallback="back">
      <Checks />
    </ErrorBoundary>
  );
}
function Checks() {
  const { repoId, number } = useLocalSearchParams<{
    repoId: string;
    number: string;
  }>();
  const [owner, repo] = decodeRepoId(repoId);
  const { colors } = useTheme();
  const detail = usePullRequestDetail(owner, repo, Number(number));
  const query = useChecks(owner, repo, detail.data?.head.sha ?? "");
  const [expanded, setExpanded] = useState<CheckGroup[]>(["Needs attention", "Running", "Unknown"]);
  const rows: Row[] = CHECK_GROUPS.flatMap((group): Row[] => {
    const checks = query.data.filter((check) => checkGroup(check.conclusion) === group);
    if (!checks.length) return [];
    return [
      { kind: "group", group, count: checks.length },
      ...(expanded.includes(group) ? checks.map((check): Row => ({ kind: "check", check })) : []),
    ];
  });
  return (
    <>
      <PRHeader title="Checks" repoId={repoId} number={number} />
      <PRList
        data={rows}
        keyExtractor={(row) => (row.kind === "group" ? row.group : row.check.key)}
        getItemType={(row) => row.kind}
        header={
          <>
            <Text style={[s.title, { color: colors.textPrimary }]}>
              {checksSummary(
                query.data,
                detail.isLoading || query.isLoading,
                detail.isError || query.isError,
                Boolean(query.hasNextPage),
              )}
            </Text>
            <Text style={[s.meta, { color: colors.textSecondary }]}>
              {query.data.length} loaded
              {query.total !== undefined ? ` of ${query.total}` : ""} · Latest head{" "}
              {detail.data?.head.sha.slice(0, 7) ?? "unknown"}
            </Text>
          </>
        }
        renderItem={({ item }) => {
          if (item.kind === "group") {
            const open = expanded.includes(item.group);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.xs,
                  paddingHorizontal: Layout.screenPadding,
                  paddingTop: Spacing.md,
                  paddingBottom: Spacing.xs,
                }}
                onPress={() =>
                  setExpanded((previous) =>
                    previous.includes(item.group)
                      ? previous.filter((group) => group !== item.group)
                      : [...previous, item.group],
                  )
                }
              >
                <Octicons
                  name={open ? "chevron-down" : "chevron-right"}
                  size={14}
                  color={colors.textMuted}
                />
                <Text
                  style={[
                    s.title,
                    {
                      color:
                        item.group === "Needs attention"
                          ? colors.danger
                          : item.group === "Running"
                            ? colors.warning
                            : colors.textPrimary,
                    },
                  ]}
                >
                  {item.group}
                </Text>
                <Text style={[s.meta, { color: colors.textMuted }]}>{item.count}</Text>
              </Pressable>
            );
          }
          const check = item.check;
          const display = getCheckDisplay(check.status, check.conclusion, colors);
          const endedAt = check.completedAt ?? check.startedAt;
          const duration =
            check.startedAt && check.completedAt
              ? formatDuration(check.startedAt, check.completedAt)
              : null;
          const meta = [duration, endedAt ? relativeTime(endedAt) : null]
            .filter(Boolean)
            .join(" · ");
          const branch = detail.data?.head.ref;
          const disabled = !check.runId && !check.url;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled }}
              accessibilityLabel={`${check.name}, ${display.label}${check.app ? `, ${check.app}` : ""}`}
              disabled={disabled}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "flex-start",
                gap: Spacing.md,
                paddingHorizontal: Layout.screenPadding,
                paddingVertical: Spacing.sm,
                opacity: pressed || disabled ? 0.6 : 1,
              })}
              onPress={() => {
                if (check.runId)
                  router.push({
                    pathname: "/(app)/repo/[repoId]/checks/[runId]",
                    params: {
                      repoId,
                      runId: String(check.runId),
                      prNumber: number,
                    },
                  });
                else if (check.url && isSafeExternalUrl(check.url)) void Linking.openURL(check.url);
              }}
            >
              <Octicons
                name={display.icon}
                size={16}
                color={display.color}
                style={{ marginTop: 2 }}
              />
              <View style={{ flex: 1, gap: Spacing.xs }}>
                <Text style={[s.text, { color: colors.textPrimary }]}>{check.name}</Text>
                {check.app && (
                  <Text style={[s.meta, { color: colors.textMuted }]}>{check.app}</Text>
                )}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: Spacing.xs,
                  }}
                >
                  {branch && (
                    <View
                      style={{
                        backgroundColor: colors.accentSubtle,
                        borderRadius: Radius.full,
                        paddingHorizontal: Spacing.xs + 2,
                        paddingVertical: 2,
                        maxWidth: 180,
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: FontFamily.mono,
                          fontSize: 10,
                          color: colors.accent,
                        }}
                      >
                        {branch}
                      </Text>
                    </View>
                  )}
                  {meta.length > 0 && (
                    <Text style={[s.meta, { color: colors.textMuted }]}>{meta}</Text>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
        footer={
          <>
            {detail.isError ? (
              <PRPageState
                {...detail}
                count={0}
                isFetchingNextPage={false}
                fetchNextPage={detail.refetch}
                emptyText="PR head unavailable"
              />
            ) : (
              detail.data && (
                <PRPageState
                  {...query}
                  count={query.data.length}
                  emptyText="No checks reported for this commit"
                />
              )
            )}
            <Text style={[s.meta, { padding: 16, color: colors.textSecondary }]}>
              GitHub limits this API to the 1,000 most recent check suites. Older suites may be
              omitted.
            </Text>
            <PRGitHubLink url={`https://github.com/${owner}/${repo}/pull/${number}/checks`} />
          </>
        }
      />
    </>
  );
}
