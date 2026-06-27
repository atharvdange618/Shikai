import { ListItemSeparator } from "@/components/shared/ListItemSeparator";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

import { RepoCard } from "@/components/repo/RepoCard";
import type { SortOption, TypeOption } from "@/components/repo/RepoFilters";
import { RepoFilters } from "@/components/repo/RepoFilters";
import { SearchBar } from "@/components/shared/SearchBar";
import { useRepos } from "@/hooks/useRepos";
import { prefetchRepoDetails, prefetchRoute } from "@/lib/prefetch";
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
import { FlashList } from "@shopify/flash-list";

export default function ReposScreen() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("pushed");
  const [type, setType] = useState<TypeOption>("all");

  const prefetchMap = useRef(new Set<number>());
  const viewportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    repos,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useRepos({ search, sort, type });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.repos() });
    setRefreshing(false);
  }, [queryClient]);

  const handleRepoPress = useCallback(
    (repo: GitHubRepo) => {
      const repoId = `${repo.owner.login}__${repo.name}`;
      router.push(`/(app)/(tabs)/repos/${repoId}`);
    },
    [router],
  );

  const handleRepoPressIn = useCallback(
    (repo: GitHubRepo) => {
      const repoId = `${repo.owner.login}__${repo.name}`;
      prefetchRoute(`/(app)/(tabs)/repos/${repoId}`);
      prefetchRepoDetails(queryClient, repo.owner.login, repo.name);
    },
    [queryClient],
  );

  const renderItem = useCallback(
    ({ item }: { item: GitHubRepo }) => (
      <RepoCard
        repo={item}
        sort={sort}
        isDark={isDark}
        onPress={handleRepoPress}
        onPressIn={handleRepoPressIn}
      />
    ),
    [handleRepoPress, handleRepoPressIn, sort, isDark],
  );

  const onViewableItemsChanged = useMemo(
    () =>
      ({ viewableItems }: { viewableItems: { item: GitHubRepo }[] }) => {
        if (viewportTimer.current) {
          clearTimeout(viewportTimer.current);
        }
        viewportTimer.current = setTimeout(() => {
          for (const { item } of viewableItems) {
            if (!prefetchMap.current.has(item.id)) {
              prefetchMap.current.add(item.id);
              prefetchRepoDetails(queryClient, item.owner.login, item.name);
            }
          }
        }, 200);
      },
    [queryClient],
  );

  const keyExtractor = useCallback((item: GitHubRepo) => String(item.id), []);

  const overrideItemLayout = useCallback(
    (layout: { span?: number; size?: number }, item: GitHubRepo) => {
      let size = 96;
      if (item.description) {
        size += 36;
      }
      if (item.topics && item.topics.length > 0) {
        size += 34;
      }
      layout.size = size;
    },
    [],
  );

  const getItemType = useCallback(
    (item: GitHubRepo) =>
      item.topics.length > 0 ? 2 : item.description ? 1 : 0,
    [],
  );

  const s = useMemo(() => buildStyles(colors), [colors]);

  const ListHeader = useMemo(
    () => (
      <View style={s.listHeader}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search repositories…"
        />
        <RepoFilters
          sort={sort}
          type={type}
          onSortChange={setSort}
          onTypeChange={setType}
        />
      </View>
    ),
    [search, sort, type, s.listHeader],
  );

  const ListEmpty = isLoading ? (
    <View style={s.loadingContainer}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={s.loadingText}>Loading repositories…</Text>
    </View>
  ) : (
    <View style={s.emptyContainer}>
      {isError ? (
        <>
          <Text style={s.emptyTitle}>Something went wrong</Text>
          <Text style={s.emptySubtitle}>Pull down to try again</Text>
        </>
      ) : search ? (
        <>
          <Text style={s.emptyTitle}>No results for &quot;{search}&quot;</Text>
          <Text style={s.emptySubtitle}>
            Try a different search term or filter
          </Text>
        </>
      ) : type !== "all" ? (
        <>
          <Text style={s.emptyTitle}>
            No {type === "forks" ? "forked" : type} repositories
          </Text>
          <Text style={s.emptySubtitle}>Try changing the type filter</Text>
        </>
      ) : (
        <>
          <Text style={s.emptyTitle}>No repositories yet</Text>
          <Text style={s.emptySubtitle}>
            Create a repo on GitHub and it&apos;ll show up here
          </Text>
        </>
      )}
    </View>
  );

  const ListFooter = isFetchingNextPage ? (
    <View style={s.footerLoader}>
      <Text style={s.footerText}>Loading more…</Text>
    </View>
  ) : null;

  return (
    <View style={s.container}>
      <FlashList
        data={repos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.listContent}
        ItemSeparatorComponent={ListItemSeparator}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        overrideItemLayout={overrideItemLayout}
        getItemType={getItemType}
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
      paddingTop: Spacing.md,
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },

    separator: {
      height: Spacing.sm,
    },

    loadingContainer: {
      paddingTop: Spacing["3xl"],
      alignItems: "center",
      gap: Spacing.md,
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
