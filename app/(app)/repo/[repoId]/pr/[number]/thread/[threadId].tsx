import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PRHeader } from "@/components/repo/PRHeader";
import { PRPageState, prStyles as s } from "@/components/repo/PRList";
import { ReviewThreadList } from "@/components/repo/ReviewThreadList";
import { useTheme } from "@/constants/theme";
import { usePullRequestReviewComments } from "@/hooks/usePullRequestDetail";
import { buildThreads } from "@/lib/pr-review";
import { decodeRepoId } from "@/lib/utils";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text } from "react-native";

export default function ThreadScreen() {
  return (
    <ErrorBoundary fallback="back">
      <Thread />
    </ErrorBoundary>
  );
}
function Thread() {
  const { repoId, number, threadId } = useLocalSearchParams<{
    repoId: string;
    number: string;
    threadId: string;
  }>();
  const [owner, repo] = decodeRepoId(repoId);
  const { colors } = useTheme();
  const query = usePullRequestReviewComments(owner, repo, Number(number));
  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = query;
  // Replies can arrive on later pages even when the root comment is already loaded.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isError) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage]);
  const thread = buildThreads(query.comments).find(
    (item) => item.root.id === Number(threadId),
  );
  return (
    <>
      <PRHeader title="Review thread" repoId={repoId} number={number} />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={s.content}
      >
        {thread && (
          <ReviewThreadList
            reviewComments={[thread.root, ...thread.replies]}
            colors={colors}
          />
        )}
        {query.hasNextPage && (
          <Text style={[s.meta, { color: colors.textSecondary }]}>
            Loading remaining comments and replies…
          </Text>
        )}
        <PRPageState
          {...query}
          count={thread ? 1 : 0}
          emptyText="Thread not found"
        />
      </ScrollView>
    </>
  );
}
