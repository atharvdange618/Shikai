import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { RepoCard } from "@/components/repo/RepoCard";
import type { SortOption } from "@/components/repo/RepoFilters";
import { RepoFilters } from "@/components/repo/RepoFilters";
import { SearchBar } from "@/components/shared/SearchBar";
import { useStarred } from "@/hooks/useStarred";
import { queryKeys } from "@/lib/query-client";
import type { GitHubRepo } from "@/types/github.types";

import {
  DarkColors,
  FontFamily,
  FontSize,
  Layout,
  LightColors,
  Spacing,
} from "@/constants/theme";

export default function StarsScreen() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("updated");

  const {
    repos,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useStarred({ search, sort: sort === "updated" ? "updated" : "created" });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.starred() });
    setRefreshing(false);
  }, [queryClient]);

  const handleRepoPress = useCallback(
    (repoId: string) => {
      router.push(`/(app)/(tabs)/repos/${repoId}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: GitHubRepo }) => (
      <MemoizedRepoCard
        id={item.id}
        name={item.name}
        ownerLogin={item.owner.login}
        description={item.description}
        language={item.language}
        license={item.license}
        updatedAt={item.updated_at}
        stargazersCount={item.stargazers_count}
        topics={item.topics}
        isPrivate={item.private}
        onPress={handleRepoPress}
      />
    ),
    [handleRepoPress],
  );

  const keyExtractor = useCallback((item: GitHubRepo) => String(item.id), []);

  const onEndReached = useCallback(() => {
    if (hasNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  const s = useMemo(() => buildStyles(colors), [colors]);

  const Separator = useCallback(() => <View style={s.separator} />, [s]);

  const ListHeader = useMemo(
    () => (
      <View style={s.listHeader}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search starred repos…"
        />
        <RepoFilters sort={sort} onSortChange={setSort} />
      </View>
    ),
    [s, search, sort],
  );

  const ListEmpty = useMemo(() => {
    if (isLoading) return null;
    return (
      <View style={s.emptyContainer}>
        {isError ? (
          <>
            <Text style={s.emptyTitle}>Something went wrong</Text>
            <Text style={s.emptySubtitle}>Pull down to try again</Text>
          </>
        ) : search ? (
          <>
            <Text style={s.emptyTitle}>
              No results for &quot;{search}&quot;
            </Text>
            <Text style={s.emptySubtitle}>Try a different search term</Text>
          </>
        ) : (
          <>
            <Text style={s.emptyTitle}>No starred repos yet</Text>
            <Text style={s.emptySubtitle}>
              Star repos on GitHub and they&apos;ll appear here
            </Text>
          </>
        )}
      </View>
    );
  }, [isLoading, isError, search, s]);

  const ListFooter = useMemo(
    () =>
      isFetchingNextPage ? (
        <View style={s.footerLoader}>
          <Text style={s.footerText}>Loading more…</Text>
        </View>
      ) : null,
    [isFetchingNextPage, s],
  );

  return (
    <View style={s.container}>
      <FlatList
        data={repos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.listContent}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        removeClippedSubviews
      />
    </View>
  );
}

interface MemoizedRepoCardProps {
  id: number;
  name: string;
  ownerLogin: string;
  description: string | null;
  language: string | null;
  license: { spdx_id: string } | null;
  updatedAt: string;
  stargazersCount: number;
  topics: string[];
  isPrivate: boolean;
  onPress: (repoId: string) => void;
}

const MemoizedRepoCard = memo(function MemoizedRepoCard({
  id,
  name,
  ownerLogin,
  description,
  language,
  license,
  updatedAt,
  stargazersCount,
  topics,
  isPrivate,
  onPress,
}: MemoizedRepoCardProps) {
  const repo: GitHubRepo = useMemo(
    () => ({
      id,
      name,
      owner: { login: ownerLogin } as any,
      description,
      language,
      license,
      updated_at: updatedAt,
      stargazers_count: stargazersCount,
      topics,
      private: isPrivate,
    }),
    [
      id,
      name,
      ownerLogin,
      description,
      language,
      license,
      updatedAt,
      stargazersCount,
      topics,
      isPrivate,
    ],
  ) as GitHubRepo;

  const handlePress = useCallback(() => {
    const repoId = `${ownerLogin}__${name}`;
    onPress(repoId);
  }, [ownerLogin, name, onPress]);

  return <RepoCard repo={repo} onPress={handlePress} />;
});

function buildStyles(colors: typeof LightColors | typeof DarkColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    listContent: {
      paddingHorizontal: Layout.screenPadding,
      paddingBottom: Spacing.xxl,
    },

    listHeader: {
      paddingTop: Spacing.md,
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },

    separator: {
      height: Spacing.sm,
    },

    emptyContainer: {
      paddingTop: Spacing["3xl"],
      alignItems: "center",
      gap: Spacing.sm,
    },

    emptyTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
      textAlign: "center",
    },

    emptySubtitle: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textMuted,
      textAlign: "center",
    },

    footerLoader: {
      paddingVertical: Spacing.lg,
      alignItems: "center",
    },

    footerText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textMuted,
    },
  });
}
