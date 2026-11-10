import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommitCard } from "@/components/repo/CommitCard";
import { PRHeader } from "@/components/repo/PRHeader";
import { PRGitHubLink, PRList, PRPageState, prStyles as s } from "@/components/repo/PRList";
import { Layout, Spacing, useTheme } from "@/constants/theme";
import { usePullRequestCommits, usePullRequestDetail } from "@/hooks/usePullRequestDetail";
import { decodeRepoId } from "@/lib/utils";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function CommitsScreen() {
  return (
    <ErrorBoundary fallback="back">
      <Commits />
    </ErrorBoundary>
  );
}
function Commits() {
  const { repoId, number } = useLocalSearchParams<{
    repoId: string;
    number: string;
  }>();
  const [owner, repo] = decodeRepoId(repoId);
  const { colors } = useTheme();
  const query = usePullRequestCommits(owner, repo, Number(number));
  const detail = usePullRequestDetail(owner, repo, Number(number));
  return (
    <>
      <PRHeader title="Commits" repoId={repoId} number={number} />
      <PRList
        data={query.commits}
        keyExtractor={(commit) => commit.sha}
        header={
          <Text style={[s.text, { color: colors.textSecondary }]}>
            {query.commits.length} loaded
            {detail.data ? ` of ${detail.data.commits}` : ""} · Oldest first
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              paddingHorizontal: Layout.screenPadding,
              paddingBottom: Spacing.sm,
            }}
          >
            <CommitCard commit={item} repoId={repoId} prNumber={number} />
          </View>
        )}
        footer={
          <>
            <PRPageState {...query} count={query.commits.length} emptyText="No commits" />
            {(detail.data?.commits ?? 0) > 250 && (
              <>
                <Text style={[s.text, { padding: 16, color: colors.textSecondary }]}>
                  GitHub’s PR API exposes at most 250 commits. Open GitHub for the full history.
                </Text>
                <PRGitHubLink url={`https://github.com/${owner}/${repo}/pull/${number}/commits`} />
              </>
            )}
          </>
        }
      />
    </>
  );
}
