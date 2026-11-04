import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DiffStat, getFileStatusDisplay } from "@/components/repo/DiffStat";
import { PRHeader } from "@/components/repo/PRHeader";
import {
  PRGitHubLink,
  PRList,
  PRPageState,
  prStyles as s,
} from "@/components/repo/PRList";
import { Spacing, useTheme } from "@/constants/theme";
import {
  usePullRequestDetail,
  usePullRequestFiles,
} from "@/hooks/usePullRequestDetail";
import { decodeRepoId } from "@/lib/utils";
import { Octicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function FilesScreen() {
  return (
    <ErrorBoundary fallback="back">
      <Files />
    </ErrorBoundary>
  );
}
function Files() {
  const { repoId, number } = useLocalSearchParams<{
    repoId: string;
    number: string;
  }>();
  const [owner, repo] = decodeRepoId(repoId);
  const { colors } = useTheme();
  const detail = usePullRequestDetail(owner, repo, Number(number));
  const query = usePullRequestFiles(owner, repo, Number(number));
  return (
    <>
      <PRHeader title="Files changed" repoId={repoId} number={number} />
      <PRList
        data={query.files}
        keyExtractor={(file) => file.filename}
        header={
          <>
            <Text style={[s.title, { color: colors.textPrimary }]}>
              {detail.data
                ? `${detail.data.changed_files} files · `
                : "Files changed"}
              {detail.data && (
                <>
                  <Text style={{ color: colors.success }}>
                    +{detail.data.additions.toLocaleString()}
                  </Text>
                  <Text style={{ color: colors.textMuted }}> / </Text>
                  <Text style={{ color: colors.danger }}>
                    −{detail.data.deletions.toLocaleString()}
                  </Text>
                </>
              )}
            </Text>
            <Text style={[s.meta, { color: colors.textSecondary }]}>
              {query.files.length} loaded
              {detail.data ? ` of ${detail.data.changed_files}` : ""}
            </Text>
            {detail.isError && (
              <Pressable
                accessibilityRole="button"
                style={s.button}
                onPress={() => void detail.refetch()}
              >
                <Text style={{ color: colors.accent }}>
                  PR totals unavailable · Retry
                </Text>
              </Pressable>
            )}
          </>
        }
        renderItem={({ item: file }) => {
          const display = getFileStatusDisplay(file.status, colors);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${file.filename}, ${file.status}, ${file.additions} additions, ${file.deletions} deletions`}
              style={[s.row, { borderColor: colors.border }]}
              onPress={() =>
                router.push({
                  pathname: "/(app)/repo/[repoId]/diff",
                  params: {
                    repoId,
                    number,
                    source: "pr",
                    filename: file.filename,
                  },
                })
              }
            >
              <Text style={[s.mono, { color: colors.textPrimary }]}>
                {file.filename} ›
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.xs,
                }}
              >
                <Octicons name={display.icon} size={14} color={display.color} />
                <Text style={[s.meta, { color: colors.textSecondary }]}>
                  {file.status}
                </Text>
                <Text style={[s.meta, { color: colors.textMuted }]}>·</Text>
                <DiffStat
                  additions={file.additions}
                  deletions={file.deletions}
                />
              </View>
            </Pressable>
          );
        }}
        footer={
          <>
            <PRPageState
              {...query}
              count={query.files.length}
              emptyText="No changed files"
            />
            {(detail.data?.changed_files ?? 0) > 3000 && (
              <>
                <Text
                  style={[s.text, { padding: 16, color: colors.textSecondary }]}
                >
                  GitHub’s API exposes at most 3,000 files. Open GitHub for the
                  rest.
                </Text>
                <PRGitHubLink
                  url={`https://github.com/${owner}/${repo}/pull/${number}/files`}
                />
              </>
            )}
          </>
        }
      />
    </>
  );
}
