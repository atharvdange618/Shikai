import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import {
  FontFamily,
  FontSize,
  IconSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
  type ColorTokens,
} from "@/constants/theme";
import { useRepoDetailsScreen } from "@/hooks/useRepoDetails";
import { useReleases } from "@/hooks/useReleases";
import { fetchIssues, fetchPullRequests } from "@/lib/github-rest";
import { prefetchFileTree, prefetchRepoCommits } from "@/lib/prefetch";
import { queryKeys } from "@/lib/query-client";
import { decodeRepoId, encodeRepoId, formatCount } from "@/lib/utils";
import { useWatchlistStore } from "@/stores/watchlist.store";
import { Octicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CommitSpotlight } from "@/components/repo/repo-detail/CommitSpotlight";
import { RepoActionBar } from "@/components/repo/repo-detail/RepoActionBar";
import { RepoActivity } from "@/components/repo/repo-detail/RepoActivity";
import { RepoContributors } from "@/components/repo/repo-detail/RepoContributors";
import { RepoHeader } from "@/components/repo/repo-detail/RepoHeader";
import { RepoLanguages } from "@/components/repo/repo-detail/RepoLanguages";
import { RepoStats } from "@/components/repo/repo-detail/RepoStats";

const ANIM_DELAYS = {
  hero: 0,
  stats: 60,
  activity: 120,
  commitSpotlight: 180,
  languages: 240,
  contributors: 300,
  actionBar: 360,
  readme: 420,
} as const;

export default function RepoDetailsScreen() {
  const { repoId } = useLocalSearchParams<{ repoId: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");

  const [copiedHash, setCopiedHash] = useState(false);

  const repoIdEncoded = encodeRepoId(owner, repoName);
  const isWatchlisted = useWatchlistStore((s) =>
    s.isWatchlisted(repoIdEncoded),
  );
  const toggleWatchlist = useWatchlistStore((s) => s.toggleWatchlist);

  const handleBookmarkToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleWatchlist(repoIdEncoded);
  }, [toggleWatchlist, repoIdEncoded]);

  const {
    repo,
    languages,
    commitCount,
    lastCommit,
    issuesPRStats,
    contributors,
    readme,
    isLoading,
    isError,
    error,
    refetch,
  } = useRepoDetailsScreen(owner, repoName);

  const { releases } = useReleases(owner, repoName);

  useEffect(() => {
    if (repo?.name) {
      try {
        navigation.setOptions({
          title: repo.name,
          headerBackVisible: true,
        });
      } catch {
        /* navigator not ready yet */
      }
    }
  }, [repo?.name, navigation]);

  useEffect(() => {
    if (!isLoading.core) return;
    const timer = setTimeout(() => refetch(), 10_000);
    return () => clearTimeout(timer);
  }, [isLoading.core, refetch]);

  const handleCopyHash = useCallback(async () => {
    if (!lastCommit?.sha) return;
    await Clipboard.setStringAsync(lastCommit.sha);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  }, [lastCommit?.sha]);

  const handleCommitsPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/repo/${repoId}/commits`);
  }, [router, repoId]);

  const handleCommitsPressIn = useCallback(() => {
    if (!owner || !repoName) return;
    prefetchRepoCommits(queryClient, owner, repoName);
  }, [queryClient, owner, repoName]);

  const handleCodePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/repo/${repoId}/files`);
  }, [router, repoId]);

  const handleCodePressIn = useCallback(() => {
    if (!owner || !repoName) return;
    prefetchFileTree(queryClient, owner, repoName);
  }, [queryClient, owner, repoName]);

  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleShare = useCallback(async () => {
    if (!repo) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const parts: string[] = [`📦 ${repo.full_name}`];
      if (repo.description) parts.push(repo.description);
      const meta: string[] = [];
      if (repo.stargazers_count > 0)
        meta.push(`⭐ ${formatCount(repo.stargazers_count)} stars`);
      if (repo.language) meta.push(`🔧 ${repo.language}`);
      if (meta.length > 0) parts.push(meta.join("  ·  "));
      parts.push(repo.html_url);
      await Share.share({ message: parts.join("\n") });
    } catch {
      /* share cancelled */
    }
  }, [repo]);

  const handleShareLongPress = useCallback(async () => {
    if (!repo?.html_url) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(repo.html_url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }, [repo?.html_url]);

  const handleIssuesPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/repo/${repoId}/issues`);
  }, [router, repoId]);

  const handleIssuesPressIn = useCallback(() => {
    if (!owner || !repoName) return;
    queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.repoIssues(owner, repoName, "open"),
      queryFn: ({ pageParam }) =>
        fetchIssues(owner, repoName, pageParam, 10, "open"),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,
      pages: 1,
      staleTime: 1000 * 60 * 2,
    });
  }, [owner, repoName, queryClient]);

  const handlePRsPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/repo/${repoId}/pull-requests`);
  }, [router, repoId]);

  const handlePRsPressIn = useCallback(() => {
    if (!owner || !repoName) return;
    queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.repoPullRequests(owner, repoName, "open"),
      queryFn: ({ pageParam }) =>
        fetchPullRequests(owner, repoName, pageParam, 10, "open"),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,
      pages: 1,
      staleTime: 1000 * 60 * 2,
    });
  }, [owner, repoName, queryClient]);

  const handleReleasesPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/repo/${repoId}/releases`);
  }, [router, repoId]);

  const handleOwnerPress = useCallback(() => {
    router.push({
      pathname: "/(app)/user/[username]",
      params: { username: owner },
    });
  }, [router, owner]);

  const insets = useSafeAreaInsets();
  const s = useMemo(
    () => buildStyles(colors, insets.bottom),
    [colors, insets.bottom],
  );

  const chevronOpacity = useSharedValue(1);
  const chevronTranslateY = useSharedValue(0);
  const hasScrolledPast = useRef(false);

  useEffect(() => {
    chevronTranslateY.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, [chevronTranslateY]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      if (y > 300 && !hasScrolledPast.current) {
        hasScrolledPast.current = true;
        chevronOpacity.value = withTiming(0, { duration: 300 });
      } else if (y <= 50 && hasScrolledPast.current) {
        hasScrolledPast.current = false;
        chevronOpacity.value = withTiming(1, { duration: 300 });
      }
    },
    [chevronOpacity],
  );

  const chevronStyle = useAnimatedStyle(() => ({
    opacity: chevronOpacity.value,
    transform: [{ translateY: chevronTranslateY.value }],
  }));

  if (isError) {
    return (
      <View style={s.centered}>
        <Octicons name="alert" size={IconSize.xl} color={colors.danger} />
        <Text style={s.errorTitle}>Failed to load repository</Text>
        <Text style={s.errorSubtitle}>{(error as Error)?.message}</Text>
        <Pressable style={s.retryButton} onPress={() => refetch()}>
          <Text style={s.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Animated.View
          entering={FadeInDown.duration(400).delay(ANIM_DELAYS.hero)}
        >
          <RepoHeader
            repo={repo}
            owner={owner}
            readme={readme}
            isLoading={isLoading.core}
            colors={colors}
            onOwnerPress={handleOwnerPress}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(ANIM_DELAYS.stats)}
        >
          <RepoStats
            stars={repo?.stargazers_count ?? 0}
            forks={repo?.forks_count ?? 0}
            watchers={repo?.watchers_count ?? 0}
            commits={commitCount ?? 0}
            isLoading={isLoading.core}
            isCommitsLoading={isLoading.commitCount}
            colors={colors}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(ANIM_DELAYS.activity)}
        >
          <RepoActivity
            openIssues={issuesPRStats?.openIssues ?? 0}
            openPRs={issuesPRStats?.openPullRequests ?? 0}
            isLoading={isLoading.core}
            colors={colors}
            onIssuesPress={handleIssuesPress}
            onIssuesPressIn={handleIssuesPressIn}
            onPRsPress={handlePRsPress}
            onPRsPressIn={handlePRsPressIn}
            showReleases={releases.length > 0}
            releaseCount={releases.length}
            onReleasesPress={handleReleasesPress}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(ANIM_DELAYS.actionBar)}
        >
          <RepoActionBar
            isWatchlisted={isWatchlisted}
            copiedUrl={copiedUrl}
            colors={colors}
            onCodePress={handleCodePress}
            onCodePressIn={handleCodePressIn}
            onCommitsPress={handleCommitsPress}
            onCommitsPressIn={handleCommitsPressIn}
            onShare={handleShare}
            onShareLongPress={handleShareLongPress}
            onBookmarkToggle={handleBookmarkToggle}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(ANIM_DELAYS.commitSpotlight)}
        >
          <CommitSpotlight
            commit={lastCommit ?? undefined}
            isLoading={isLoading.core}
            copiedHash={copiedHash}
            colors={colors}
            onCopyHash={handleCopyHash}
            onPress={
              lastCommit
                ? () =>
                    router.push({
                      pathname: "/(app)/repo/[repoId]/commit/[sha]",
                      params: { repoId, sha: lastCommit.sha },
                    })
                : undefined
            }
          />
        </Animated.View>

        {!(languages.length === 0 && !isLoading.core) && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(ANIM_DELAYS.languages)}
          >
            <RepoLanguages
              languages={languages}
              isLoading={isLoading.core}
              colors={colors}
            />
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.duration(400).delay(ANIM_DELAYS.contributors)}
        >
          <RepoContributors
            contributors={contributors}
            isLoading={isLoading.contributors}
            colors={colors}
          />
        </Animated.View>

        {readme && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(ANIM_DELAYS.readme)}
            style={s.readmeSection}
          >
            <MarkdownRenderer
              markdown={readme}
              context={`${owner}/${repoName}`}
            />
          </Animated.View>
        )}
      </ScrollView>

      <Animated.View
        style={[s.scrollChevron, { bottom: insets.bottom + 16 }, chevronStyle]}
        pointerEvents="none"
      >
        <View style={s.scrollChevronBg}>
          <Octicons name="chevron-down" size={20} color={colors.textMuted} />
        </View>
      </Animated.View>
    </View>
  );
}

function buildStyles(colors: ColorTokens, bottomInset: number) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingHorizontal: Layout.screenPadding,
      paddingVertical: Spacing.lg,
      gap: Spacing.lg,
      paddingBottom: bottomInset,
      maxWidth: 680,
      width: "100%",
      alignSelf: "center",
    },

    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.md,
      padding: Spacing.xl,
      backgroundColor: colors.background,
    },

    readmeSection: {},

    scrollChevron: {
      position: "absolute",
      left: 0,
      right: 0,
      alignItems: "center",
      pointerEvents: "none",
    },

    scrollChevronBg: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.surface}E6`,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },

    errorTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
    },

    errorSubtitle: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textMuted,
      textAlign: "center",
    },

    retryButton: {
      backgroundColor: colors.accent,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      marginTop: Spacing.sm,
    },

    retryText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textOnAccent,
    },
  });
}
