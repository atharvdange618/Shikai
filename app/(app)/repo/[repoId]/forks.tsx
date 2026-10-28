import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";

import { RepoCard } from "@/components/repo/RepoCard";
import { PagedList } from "@/components/shared/PagedList";
import { useForks } from "@/hooks/useRepoStarsForks";
import { prefetchRepoDetails, prefetchRoute } from "@/lib/prefetch";
import { decodeRepoId, encodeRepoId } from "@/lib/utils";
import type { GitHubRepo } from "@/types/github.types";

import { useTheme } from "@/constants/theme";

const keyExtractor = (item: GitHubRepo) => String(item.id);

const getItemType = (item: GitHubRepo) =>
  item.topics.length > 0 ? 2 : item.description ? 1 : 0;

export default function ForksScreen() {
  const { repoId } = useLocalSearchParams<{ repoId: string }>();
  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, isDark } = useTheme();

  const {
    forks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useForks(owner, repoName);

  const handleRepoPress = useCallback(
    (repo: GitHubRepo) => {
      const id = encodeRepoId(repo.owner.login, repo.name);
      router.push(`/(app)/repo/${id}`);
    },
    [router],
  );

  const handleRepoPressIn = useCallback(
    (repo: GitHubRepo) => {
      const id = encodeRepoId(repo.owner.login, repo.name);
      prefetchRoute(`/(app)/repo/${id}`);
      prefetchRepoDetails(queryClient, repo.owner.login, repo.name);
    },
    [queryClient],
  );

  const handleTopicPress = useCallback(
    (topic: string) => {
      router.push({ pathname: "/(app)/(tabs)/search", params: { q: topic } });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: GitHubRepo }) => (
      <RepoCard
        repo={item}
        colors={colors}
        isDark={isDark}
        onPress={handleRepoPress}
        onPressIn={handleRepoPressIn}
        onTopicPress={handleTopicPress}
      />
    ),
    [colors, isDark, handleRepoPress, handleRepoPressIn, handleTopicPress],
  );

  return (
    <PagedList
      data={forks}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      drawDistance={400}
      isLoading={isLoading}
      isError={isError}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      refetch={refetch}
      emptyText="No forks yet"
      errorText="Failed to load forks"
    />
  );
}
