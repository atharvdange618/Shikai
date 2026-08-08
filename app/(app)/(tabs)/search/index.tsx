import { Octicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { FlashList } from "@shopify/flash-list";

import { RepoCard } from "@/components/repo/RepoCard";
import { KeyboardAvoid } from "@/components/shared/KeyboardAvoid";
import { ListItemSeparator } from "@/components/shared/ListItemSeparator";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchTab, useGlobalSearch } from "@/hooks/useGlobalSearch";
import { prefetchRepoDetails, prefetchRoute } from "@/lib/prefetch";
import { encodeRepoId } from "@/lib/utils";
import type { GitHubIssue, GitHubRepo, GitHubUser } from "@/types/github.types";

import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";

const TABS: { key: SearchTab; label: string }[] = [
  { key: "repos", label: "Repos" },
  { key: "users", label: "Users" },
  { key: "issues", label: "Issues" },
  { key: "topics", label: "Topics" },
];

const keyExtractor = (item: GitHubRepo | GitHubUser | GitHubIssue) =>
  String(item.id);

export default function SearchScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<TextInput>(null);
  const params = useLocalSearchParams<{ q?: string }>();

  const [search, setSearch] = useState(params.q ?? "");
  const [tab, setTab] = useState<SearchTab>("repos");
  const [isOffline, setIsOffline] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      setIsOffline(
        state.isConnected === false || state.isInternetReachable === false,
      );
    });
  }, []);

  const {
    repos,
    users,
    issues,
    topics,
    totalCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useGlobalSearch({ query: debouncedSearch, tab });

  const s = useMemo(() => buildStyles(colors), [colors]);

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
      setSearch(topic);
      setTab("topics");
    },
    [],
  );

  const renderRepoItem = useCallback(
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

  const renderUserItem = useCallback(
    ({ item }: { item: GitHubUser }) => (
      <Pressable
        style={({ pressed }) => [s.userCard, pressed && { opacity: 0.7 }]}
        onPress={() => {
          router.push({
            pathname: "/(app)/user/[username]",
            params: { username: item.login },
          });
        }}
      >
        {item.avatar_url ? (
          <Image
            source={{ uri: item.avatar_url }}
            style={s.userAvatar}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={s.userAvatar}>
            <Text style={s.userAvatarText}>
              {item.login.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={s.userInfo}>
          <Text style={s.userName}>{item.login}</Text>
          {item.type && <Text style={s.userType}>{item.type}</Text>}
        </View>
        <Octicons name="chevron-right" size={14} color={colors.textMuted} />
      </Pressable>
    ),
    [s, colors, router],
  );

  const renderIssueItem = useCallback(
    ({ item }: { item: GitHubIssue }) => (
      <Pressable
        style={({ pressed }) => [s.issueCard, pressed && { opacity: 0.7 }]}
        onPress={() => {
          const repoMatch = item.repository_url?.match(
            /\/repos\/([^/]+)\/([^/]+)$/,
          );
          if (repoMatch) {
            const [, owner, repo] = repoMatch;
            const repoId = encodeRepoId(owner, repo);
            router.push({
              pathname: "/(app)/repo/[repoId]/issue/[number]",
              params: { repoId, number: String(item.number) },
            });
          }
        }}
      >
        <View style={s.issueHeader}>
          <Octicons
            name={item.pull_request ? "git-pull-request" : "issue-opened"}
            size={14}
            color={item.pull_request ? colors.merged : colors.success}
          />
          <Text style={s.issueTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <Text style={s.issueMeta} numberOfLines={1}>
          #{item.number}
          {item.user && ` by ${item.user.login}`}
          {item.state && ` \u00b7 ${item.state}`}
        </Text>
        {item.repository_url &&
          (() => {
            const repoMatch = item.repository_url.match(
              /\/repos\/([^/]+\/[^/]+)$/,
            );
            return repoMatch ? (
              <Text style={s.issueRepo} numberOfLines={1}>
                {repoMatch[1]}
              </Text>
            ) : null;
          })()}
      </Pressable>
    ),
    [colors, s, router],
  );

  const renderItem = useCallback(
    ({ item }: { item: GitHubRepo | GitHubUser | GitHubIssue }) => {
      if (tab === "repos" || tab === "topics")
        return renderRepoItem({ item: item as GitHubRepo });
      if (tab === "users") return renderUserItem({ item: item as GitHubUser });
      return renderIssueItem({ item: item as GitHubIssue });
    },
    [tab, renderRepoItem, renderUserItem, renderIssueItem],
  );

  const data =
    tab === "repos"
      ? repos
      : tab === "users"
        ? users
        : tab === "topics"
          ? topics
          : issues;

  const ListEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      );
    }
    if (isOffline && debouncedSearch && data.length === 0) {
      return (
        <View style={s.emptyContainer}>
          <Octicons name="cloud-offline" size={32} color={colors.textMuted} />
          <Text style={s.emptyTitle}>
            Search requires internet connection
          </Text>
          <Text style={s.emptySubtitle}>
            Connect to GitHub to search repositories, users, and issues
          </Text>
        </View>
      );
    }
    if (!debouncedSearch) {
      return (
        <View style={s.emptyContainer}>
          <Octicons name="search" size={32} color={colors.textMuted} />
          <Text style={s.emptyTitle}>Search GitHub</Text>
          <Text style={s.emptySubtitle}>
            Find repositories, users, issues, and pull requests
          </Text>
        </View>
      );
    }
    return (
      <View style={s.emptyContainer}>
        <Text style={s.emptyTitle}>No results</Text>
        <Text style={s.emptySubtitle}>Try a different search term</Text>
      </View>
    );
  }, [isLoading, isOffline, debouncedSearch, data.length, s, colors]);

  const ListFooter = isFetchingNextPage ? (
    <View style={s.footerLoader}>
      <ActivityIndicator size="small" color={colors.accent} />
    </View>
  ) : null;

  return (
    <KeyboardAvoid>
      <View style={s.container}>
      <View style={s.searchContainer}>
        <View style={s.searchBar}>
          <Octicons name="search" size={15} color={colors.textMuted} />
          <TextInput
            ref={searchInputRef}
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search GitHub..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Octicons
                name="x-circle-fill"
                size={15}
                color={colors.textMuted}
              />
            </Pressable>
          )}
        </View>

        <View style={s.tabRow}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              style={[s.tab, tab === t.key && s.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {debouncedSearch.length > 0 && (
          <Text style={s.resultCount}>
            {totalCount.toLocaleString()} {tab} found
          </Text>
        )}
      </View>

      <FlashList
        data={data}
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
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        drawDistance={400}
      />
      </View>
    </KeyboardAvoid>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    searchContainer: {
      paddingHorizontal: Layout.screenPadding,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      gap: Spacing.sm,
    },

    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      height: 44,
      gap: Spacing.sm,
    },

    searchInput: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textPrimary,
      paddingVertical: 0,
    },

    tabRow: {
      flexDirection: "row",
      gap: Spacing.xs,
    },

    tab: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.full,
      backgroundColor: colors.surfaceSecondary,
    },

    tabActive: {
      backgroundColor: colors.accentSubtle,
    },

    tabText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textSecondary,
    },

    tabTextActive: {
      color: colors.accent,
    },

    resultCount: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
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
      paddingHorizontal: Spacing.xl,
    },

    footerLoader: {
      paddingVertical: Spacing.lg,
      alignItems: "center",
    },

    userCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.md,
    },

    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accentSubtle,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },

    userAvatarText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.accent,
    },

    userInfo: {
      flex: 1,
      gap: 2,
    },

    userName: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
    },

    userType: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },

    issueCard: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.xs,
    },

    issueHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },

    issueTitle: {
      flex: 1,
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
    },

    issueMeta: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      marginLeft: 22,
    },

    issueRepo: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
      marginLeft: 22,
    },
  });
}
