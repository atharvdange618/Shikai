import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { RepoCard } from "@/components/repo/RepoCard";
import { ListItemSeparator } from "@/components/shared/ListItemSeparator";
import { useUserAllRepos } from "@/hooks/useUserProfileRepos";
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

const keyExtractor = (item: GitHubRepo) => String(item.id);

const overrideItemLayout = (
  layout: { span?: number; size?: number },
  item: GitHubRepo,
) => {
  let size = 96;
  if (item.description) size += 36;
  if (item.topics && item.topics.length > 0) size += 34;
  layout.size = size;
};

const getItemType = (item: GitHubRepo) =>
  item.topics.length > 0 ? 2 : item.description ? 1 : 0;

export default function UserReposScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, isDark } = useTheme();

  const [refreshing, setRefreshing] = useState(false);

  const {
    repos,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useUserAllRepos(username ?? "");

  useEffect(() => {
    try {
      navigation.setOptions({ title: "Repositories" });
    } catch {
      /* navigator not ready yet */
    }
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.userAllRepos(username ?? ""),
    });
    setRefreshing(false);
  }, [queryClient, username]);

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
        showOwner={false}
        onPress={handleRepoPress}
        onPressIn={handleRepoPressIn}
        onTopicPress={handleTopicPress}
      />
    ),
    [colors, isDark, handleRepoPress, handleRepoPressIn, handleTopicPress],
  );

  const s = useMemo(() => buildStyles(colors), [colors]);

  const ListEmpty = isLoading ? (
    <View style={s.centered}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  ) : (
    <View style={s.centered}>
      <Text style={s.emptyTitle}>
        {isError ? "Failed to load repositories" : "No public repositories"}
      </Text>
    </View>
  );

  return (
    <View style={s.container}>
      <FlashList
        data={repos}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.listContent}
        ItemSeparatorComponent={ListItemSeparator}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={s.footerLoader}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
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
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xxl,
    },
    centered: {
      paddingTop: Spacing["3xl"],
      alignItems: "center",
      gap: Spacing.md,
    },
    emptyTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textSecondary,
    },
    footerLoader: {
      paddingVertical: Spacing.lg,
      alignItems: "center",
    },
  });
}
