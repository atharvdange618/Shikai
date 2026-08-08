import { Octicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FlashList } from "@shopify/flash-list";

import { RepoCard } from "@/components/repo/RepoCard";
import { ListItemSeparator } from "@/components/shared/ListItemSeparator";
import { SearchBar } from "@/components/shared/SearchBar";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchIndex } from "@/hooks/useSearchIndex";
import { useStarred } from "@/hooks/useStarred";
import { useWatchlistRepos } from "@/hooks/useWatchlistRepos";
import { prefetchRepoDetails, prefetchRoute } from "@/lib/prefetch";
import { queryKeys } from "@/lib/query-client";
import { encodeRepoId } from "@/lib/utils";
import { useWatchlistStore } from "@/stores/watchlist.store";
import type { GitHubRepo } from "@/types/github.types";

import {
  FontFamily,
  FontSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";

type Tab = "stars" | "watchlist";

export default function SavedScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("stars");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [refreshing, setRefreshing] = useState(false);

  const watchlistIds = useWatchlistStore((state) => state.watchlistIds);
  const init = useWatchlistStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  const {
    repos: starredRepos,
    isLoading: starredLoading,
    fetchNextPage: fetchNextStarred,
    hasNextPage: hasNextStarred,
    isFetchingNextPage: isFetchingNextStarred,
  } = useStarred({ search: debouncedSearch, sort: "pushed" });

  const { repos: watchlistedRepos, isLoading: watchlistLoading } =
    useWatchlistRepos();

  const filteredWatchlist = useSearchIndex(watchlistedRepos, debouncedSearch);

  const repos = tab === "stars" ? starredRepos : filteredWatchlist;
  const isLoading = tab === "stars" ? starredLoading : watchlistLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (tab === "stars") {
      await queryClient.invalidateQueries({ queryKey: queryKeys.starred() });
    } else {
      await queryClient.invalidateQueries({ queryKey: ["repo"] });
    }
    setRefreshing(false);
  }, [queryClient, tab]);

  const handleRepoPress = useCallback(
    (repo: GitHubRepo) => {
      const repoId = encodeRepoId(repo.owner.login, repo.name);
      router.push(`/(app)/repo/${repoId}`);
    },
    [router],
  );

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
        colors={colors}
        isDark={isDark}
        onPress={handleRepoPress}
        onPressIn={handleRepoPressIn}
        onTopicPress={handleTopicPress}
      />
    ),
    [handleRepoPress, handleRepoPressIn, handleTopicPress, isDark, colors],
  );

  const keyExtractor = useCallback((item: GitHubRepo) => String(item.id), []);

  const s = useMemo(() => buildStyles(colors), [colors]);

  const onEndReached = useCallback(() => {
    if (tab === "stars" && hasNextStarred && !isFetchingNextStarred) {
      fetchNextStarred();
    }
  }, [tab, hasNextStarred, isFetchingNextStarred, fetchNextStarred]);

  const ListEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      );
    }
    if (tab === "stars") {
      return (
        <View style={s.emptyContainer}>
          {debouncedSearch ? (
            <>
              <Text style={s.emptyTitle}>No results</Text>
              <Text style={s.emptySubtitle}>Try a different search term</Text>
            </>
          ) : (
            <>
              <Text style={s.emptyTitle}>No starred repos</Text>
              <Text style={s.emptySubtitle}>
                Star repos on GitHub and they&apos;ll appear here
              </Text>
            </>
          )}
        </View>
      );
    }
    return (
      <View style={s.emptyContainer}>
        {watchlistIds.length === 0 ? (
          <>
            <Text style={s.emptyTitle}>No saved repos</Text>
            <Text style={s.emptySubtitle}>
              Tap the bookmark icon on any repo card to save it
            </Text>
          </>
        ) : (
          <>
            <Text style={s.emptyTitle}>No results</Text>
            <Text style={s.emptySubtitle}>Try a different search term</Text>
          </>
        )}
      </View>
    );
  }, [isLoading, tab, debouncedSearch, watchlistIds.length, s, colors.accent]);

  return (
    <View style={s.container}>
      <View style={s.tabRow}>
        <TabButton
          label="Stars"
          icon="star"
          count={starredRepos.length}
          isActive={tab === "stars"}
          colors={colors}
          onPress={() => {
            setTab("stars");
            setSearch("");
          }}
        />
        <TabButton
          label="Watchlist"
          icon="bookmark"
          count={watchlistIds.length}
          isActive={tab === "watchlist"}
          colors={colors}
          onPress={() => {
            setTab("watchlist");
            setSearch("");
          }}
        />
      </View>

      {repos.length > 0 && (
        <View style={s.searchRow}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={
              tab === "stars"
                ? "Search starred repos..."
                : "Search watchlist..."
            }
          />
        </View>
      )}

      <FlashList
        key={`${tab}-${debouncedSearch}`}
        data={repos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.listContent}
        ItemSeparatorComponent={ListItemSeparator}
        ListEmptyComponent={ListEmpty}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
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

function TabButton({
  label,
  icon,
  count,
  isActive,
  colors,
  onPress,
}: {
  label: string;
  icon: "star" | "bookmark";
  count: number;
  isActive: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        tabStyles.button,
        isActive && { backgroundColor: colors.accent },
        pressed && tabStyles.pressed,
      ]}
      onPress={onPress}
    >
      <Octicons
        name={icon}
        size={14}
        color={isActive ? "#fff" : colors.textMuted}
      />
      <Text
        style={[
          tabStyles.label,
          isActive && tabStyles.labelActive,
          { color: isActive ? "#fff" : colors.textMuted },
        ]}
      >
        {label}
      </Text>
      {count > 0 && (
        <View
          style={[
            tabStyles.badge,
            isActive
              ? tabStyles.badgeActive
              : { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <Text
            style={[
              tabStyles.badgeText,
              isActive
                ? tabStyles.badgeTextActive
                : { color: colors.textMuted },
            ]}
          >
            {count > 99 ? "99+" : count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const tabStyles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: "transparent",
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
  },
  labelActive: {
    color: "#fff",
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  badgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
  },
  badgeTextActive: {
    color: "#fff",
  },
});

function buildStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    tabRow: {
      flexDirection: "row",
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      gap: Spacing.sm,
    },
    searchRow: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    listContent: {
      paddingHorizontal: Layout.screenPadding,
      paddingBottom: Spacing.xxl,
    },
    loadingContainer: {
      paddingTop: Spacing["3xl"],
      alignItems: "center",
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
  });
}
