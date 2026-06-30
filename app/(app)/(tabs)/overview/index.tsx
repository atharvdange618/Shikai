import { Octicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Href, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useContributions } from "@/hooks/useContributions";
import { useEvents } from "@/hooks/useEvents";
import { useLatestRelease } from "@/hooks/useLatestRelease";
import { usePinnedRepos } from "@/hooks/usePinnedRepos";
import { useUser } from "@/hooks/useUser";
import { prefetchProfile, prefetchRoute } from "@/lib/prefetch";
import { queryKeys } from "@/lib/query-client";

import { ActivityFeed } from "@/components/overview/ActivityFeed";
import { ContributionGraph } from "@/components/overview/ContributionGraph";
import { PinnedRepoCard } from "@/components/overview/PinnedRepoCard";
import { VersionCheckBanner } from "@/components/VersionCheckBanner";

import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 4) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function OverviewScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleAvatarPressIn = useCallback(() => {
    prefetchRoute("/(app)/(tabs)/profile");
    prefetchProfile(queryClient);
  }, [queryClient]);

  const { data: user } = useUser();
  const { data: pinnedRepos, isLoading: pinnedLoading } = usePinnedRepos();
  const {
    weeks,
    totalContributions,
    stats,
    isLoading: contribLoading,
  } = useContributions();
  const {
    events,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: activityLoading,
  } = useEvents(user?.login ?? "");
  const { updateAvailable, latestVersion, releaseUrl } = useLatestRelease();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.pinned() });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.contributions(),
    });
    if (user?.login) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.events(user.login),
      });
    }
    setRefreshing(false);
  }, [queryClient, user?.login]);

  const s = useMemo(() => buildStyles(colors), [colors]);

  const hasInitialLoad = useRef(false);

  const handleActivityEndReached = useCallback(() => {
    if (!hasInitialLoad.current) {
      hasInitialLoad.current = true;
      return;
    }
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SafeAreaView style={s.safeArea} edges={["top"]}>
      <View style={s.header}>
        <View style={s.headerContent}>
          <View>
            <Text style={s.greeting}>{getGreeting()}</Text>
            <Text style={s.userName}>{user?.name || user?.login || "..."}</Text>
          </View>
          <Pressable
            onPress={() => router.push("/(app)/(tabs)/profile" as Href)}
            onPressIn={handleAvatarPressIn}
          >
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={s.avatar}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Octicons name="person" size={20} color={colors.textMuted} />
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {updateAvailable && latestVersion && (
          <VersionCheckBanner
            latestVersion={latestVersion}
            releaseUrl={releaseUrl}
          />
        )}

        <View style={s.section}>
          <Text style={s.sectionTitle}>Pinned</Text>

          {pinnedLoading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.pinnedScroll}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <View key={i} style={s.pinnedSkeleton} />
              ))}
            </ScrollView>
          ) : pinnedRepos && pinnedRepos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.pinnedScroll}
              contentContainerStyle={s.pinnedContent}
            >
              {pinnedRepos.map((repo) => (
                <PinnedRepoCard key={repo.url} repo={repo} />
              ))}
            </ScrollView>
          ) : (
            <Text style={s.emptyText}>No pinned repositories.</Text>
          )}
        </View>

        <View style={s.section}>
          <ContributionGraph
            weeks={weeks}
            totalContributions={totalContributions}
            isLoading={contribLoading}
            stats={stats}
          />
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Activity</Text>
            <Pressable
              onPress={() => router.push("/(app)/(tabs)/overview/feed" as Href)}
            >
              <Text style={s.seeAllText}>Following</Text>
            </Pressable>
          </View>

          <ActivityFeed
            events={events}
            isLoading={activityLoading}
            isLoadingMore={isFetchingNextPage}
            onEndReached={handleActivityEndReached}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.lg,
      backgroundColor: colors.background,
    },

    headerContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    greeting: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textMuted,
      marginBottom: 2,
    },

    userName: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
    },

    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceSecondary,
    },

    avatarFallback: {
      alignItems: "center",
      justifyContent: "center",
    },

    scroll: {
      flex: 1,
    },

    content: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xxl,
      gap: Spacing.xl,
    },

    section: {
      gap: Spacing.sm,
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.xs,
    },

    sectionTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
    },

    seeAllText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.accent,
    },

    pinnedScroll: {
      marginHorizontal: -Spacing.lg,
    },

    pinnedContent: {
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
    },

    pinnedSkeleton: {
      width: 220,
      height: 120,
      borderRadius: Radius.lg,
      backgroundColor: colors.surfaceSecondary,
    },

    emptyText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textMuted,
    },
  });
}
