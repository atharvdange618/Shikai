import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

import { FlashList } from "@shopify/flash-list";

import { RepoCard } from "@/components/repo/RepoCard";
import { ListItemSeparator } from "@/components/shared/ListItemSeparator";
import { SearchBar } from "@/components/shared/SearchBar";
import { useDebounce } from "@/hooks/useDebounce";
import { useRepos } from "@/hooks/useRepos";
import { useSearchIndex } from "@/hooks/useSearchIndex";
import { prefetchRepoDetails, prefetchRoute } from "@/lib/prefetch";
import { queryKeys } from "@/lib/query-client";
import { encodeRepoId } from "@/lib/utils";
import { useWatchlistStore } from "@/stores/watchlist.store";
import type { GitHubRepo } from "@/types/github.types";

import {
  DarkColors,
  FontFamily,
  FontSize,
  Layout,
  LightColors,
  Spacing,
} from "@/constants/theme";

const keyExtractor = (item: GitHubRepo) => String(item.id);

export default function WatchlistScreen() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const watchlistIds = useWatchlistStore((state) => state.watchlistIds);
  const init = useWatchlistStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  const { repos: allRepos, isLoading } = useRepos();

  const watchlistedRepos = useMemo(() => {
    return allRepos.filter((repo) => {
      const repoId = encodeRepoId(repo.owner.login, repo.name);
      return watchlistIds.includes(repoId);
    });
  }, [allRepos, watchlistIds]);

  const repos = useSearchIndex(watchlistedRepos, debouncedSearch);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.repos() });
    setRefreshing(false);
  }, [queryClient]);

  const handleRepoPress = useCallback(
    (repo: GitHubRepo) => {
      const repoId = encodeRepoId(repo.owner.login, repo.name);
      router.push(`/(app)/(tabs)/repos/${repoId}`);
    },
    [router],
  );

  const handleRepoPressIn = useCallback(
    (repo: GitHubRepo) => {
      const repoId = encodeRepoId(repo.owner.login, repo.name);
      prefetchRoute(`/(app)/(tabs)/repos/${repoId}`);
      prefetchRepoDetails(queryClient, repo.owner.login, repo.name);
    },
    [queryClient],
  );

  const renderItem = useCallback(
    ({ item }: { item: GitHubRepo }) => (
      <RepoCard
        repo={item}
        isDark={isDark}
        onPress={handleRepoPress}
        onPressIn={handleRepoPressIn}
      />
    ),
    [handleRepoPress, handleRepoPressIn, isDark],
  );

  const s = useMemo(() => buildStyles(colors), [colors]);

  const ListEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={s.loadingContainer}>
          <Text style={s.loadingText}>Loading watchlist...</Text>
        </View>
      );
    }
    return (
      <View style={s.emptyContainer}>
        {watchlistIds.length === 0 ? (
          <>
            <Text style={s.emptyTitle}>No saved repos</Text>
            <Text style={s.emptySubtitle}>
              Tap the bookmark icon on any repo card to save it here
            </Text>
          </>
        ) : (
          <>
            <Text style={s.emptyTitle}>
              No results for &quot;{debouncedSearch}&quot;
            </Text>
            <Text style={s.emptySubtitle}>Try a different search term</Text>
          </>
        )}
      </View>
    );
  }, [isLoading, watchlistIds.length, debouncedSearch, s]);

  return (
    <View style={s.container}>
      {watchlistIds.length > 0 && (
        <View style={s.listHeader}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search watchlist..."
          />
        </View>
      )}

      <FlashList
        data={repos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.listContent}
        ItemSeparatorComponent={ListItemSeparator}
        ListEmptyComponent={ListEmpty}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        removeClippedSubviews
        drawDistance={400}
      />
    </View>
  );
}

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
      paddingHorizontal: Layout.screenPadding,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md,
    },

    loadingContainer: {
      paddingTop: Spacing["3xl"],
      alignItems: "center",
    },

    loadingText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textSecondary,
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
      paddingHorizontal: Spacing.xl,
    },
  });
}
