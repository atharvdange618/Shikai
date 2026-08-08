import { ListItemSeparator } from "@/components/shared/ListItemSeparator";
import { useDebounce } from "@/hooks/useDebounce";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { RepoCard } from "@/components/repo/RepoCard";
import type { SortOption, TypeOption } from "@/components/repo/RepoFilters";
import { RepoFilters } from "@/components/repo/RepoFilters";
import { SearchBar } from "@/components/shared/SearchBar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRepos } from "@/hooks/useRepos";
import { prefetchRepoDetails, prefetchRoute } from "@/lib/prefetch";
import { queryKeys } from "@/lib/query-client";
import { encodeRepoId } from "@/lib/utils";
import type { GitHubRepo } from "@/types/github.types";

import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Layout,
  Spacing,
  useTheme,
} from "@/constants/theme";
import { FlashList } from "@shopify/flash-list";

const keyExtractor = (item: GitHubRepo) => String(item.id);

const overrideItemLayout = (
  layout: { span?: number; size?: number },
  item: GitHubRepo,
) => {
  let size = 96;
  if (item.description) {
    size += 36;
  }
  if (item.topics && item.topics.length > 0) {
    size += 34;
  }
  layout.size = size;
};

const getItemType = (item: GitHubRepo) =>
  item.topics.length > 0 ? 2 : item.description ? 1 : 0;

export default function ReposScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<TextInput>(null);
  const flashListRef = useRef<any>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("pushed");
  const [type, setType] = useState<TypeOption>("all");

  const debouncedSearch = useDebounce(search, 300);

  const prefetchMap = useRef(new Set<number>());
  const viewportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    repos,
    loadedCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useRepos({ search: debouncedSearch, sort, type });

  const [refreshing, setRefreshing] = useState(false);

  const handleRepoPress = useCallback(
    (repo: GitHubRepo) => {
      const repoId = encodeRepoId(repo.owner.login, repo.name);
      router.push(`/(app)/repo/${repoId}`);
    },
    [router],
  );

  useKeyboardShortcuts({
    onSearchFocus: useCallback(() => {
      searchInputRef.current?.focus();
    }, []),
    onEscape: useCallback(() => {
      Keyboard.dismiss();
      if (search) {
        setSearch("");
      } else if (selectedIndex >= 0) {
        setSelectedIndex(-1);
      }
    }, [search, selectedIndex]),
    onArrowUp: useCallback(() => {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    }, []),
    onArrowDown: useCallback(() => {
      setSelectedIndex((prev) => Math.min(repos.length - 1, prev + 1));
    }, [repos.length]),
    onEnter: useCallback(() => {
      if (selectedIndex >= 0 && selectedIndex < repos.length) {
        handleRepoPress(repos[selectedIndex]);
      }
    }, [selectedIndex, repos, handleRepoPress]),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.repos() });
    setRefreshing(false);
  }, [queryClient]);

  const handleRepoPressIn = useCallback(
    (repo: GitHubRepo) => {
      const repoId = encodeRepoId(repo.owner.login, repo.name);
      prefetchRoute(`/(app)/repo/${repoId}`);
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
        sort={sort}
        colors={colors}
        isDark={isDark}
        onPress={handleRepoPress}
        onPressIn={handleRepoPressIn}
        onTopicPress={handleTopicPress}
      />
    ),
    [handleRepoPress, handleRepoPressIn, handleTopicPress, sort, isDark, colors],
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

  const s = buildStyles(colors);

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
      ) : debouncedSearch ? (
        <>
          <Text style={s.emptyTitle}>
            No results for &quot;{debouncedSearch}&quot;
          </Text>
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
  ) : debouncedSearch && hasNextPage ? (
    <View style={s.footerLoader}>
      <Text style={s.footerText}>
        Showing {repos.length} of {loadedCount}+ repos
      </Text>
    </View>
  ) : null;

  const listKey = debouncedSearch.length > 0 ? "search" : "default";

  return (
    <View style={s.container}>
      <View style={s.listHeader}>
        <SearchBar
          ref={searchInputRef}
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

      <FlashList
        ref={flashListRef}
        key={listKey}
        data={repos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.listContent}
        ItemSeparatorComponent={ListItemSeparator}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        keyboardShouldPersistTaps="handled"
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

function buildStyles(colors: ColorTokens) {
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
      gap: Spacing.md,
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
