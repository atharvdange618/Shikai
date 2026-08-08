import { Octicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Href, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { usePinnedRepos } from "@/hooks/usePinnedRepos";
import { useReceivedEvents } from "@/hooks/useReceivedEvents";
import { useUser } from "@/hooks/useUser";
import { prefetchProfile, prefetchRoute } from "@/lib/prefetch";
import { queryKeys } from "@/lib/query-client";
import { compactTimeAgo } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import type { GitHubEvent } from "@/types/github.types";

import { ActivityFeed } from "@/components/overview/ActivityFeed";
import { ContributionGraph } from "@/components/overview/ContributionGraph";
import { PinnedRepoCard } from "@/components/overview/PinnedRepoCard";

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

function getFollowingEventText(event: GitHubEvent): string {
  const repoName = event.repo.name.split("/")[1] || event.repo.name;
  const actor = event.actor.login;
  switch (event.type) {
    case "PushEvent": {
      const count = event.payload.size ?? 1;
      return `${actor} pushed ${count} commit${count > 1 ? "s" : ""} to ${repoName}`;
    }
    case "WatchEvent":
      return `${actor} starred ${repoName}`;
    case "ForkEvent":
      return `${actor} forked ${repoName}`;
    case "CreateEvent": {
      const refType = event.payload.ref_type;
      return `${actor} created ${refType} in ${repoName}`;
    }
    case "PullRequestEvent":
      return `${actor} ${event.payload.action} a PR in ${repoName}`;
    case "IssuesEvent":
      return `${actor} ${event.payload.action} an issue in ${repoName}`;
    case "ReleaseEvent":
      return `${actor} released ${event.payload.release?.tag_name ?? "new version"} in ${repoName}`;
    case "PublicEvent":
      return `${actor} made ${repoName} public`;
    default:
      return `${actor} activity in ${repoName}`;
  }
}

function FollowingPreview({
  events,
  isLoading,
  onPress,
  colors,
}: {
  events: GitHubEvent[];
  isLoading: boolean;
  onPress: () => void;
  colors: ColorTokens;
}) {
  const preview = useMemo(() => events.slice(0, 2), [events]);

  if (isLoading) {
    return (
      <View style={[followStyles.container, { borderColor: colors.border }]}>
        <View style={followStyles.loading}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[followStyles.loadingText, { color: colors.textMuted }]}>
            Loading activity...
          </Text>
        </View>
      </View>
    );
  }

  if (preview.length === 0) return null;

  return (
    <Pressable
      style={({ pressed }) => [
        followStyles.container,
        { borderColor: colors.border, backgroundColor: colors.surface },
        pressed && { opacity: 0.7 },
      ]}
      onPress={onPress}
    >
      <View style={followStyles.header}>
        <View style={followStyles.headerLeft}>
          <Octicons name="people" size={14} color={colors.accent} />
          <Text
            style={[followStyles.headerTitle, { color: colors.textPrimary }]}
          >
            Following
          </Text>
        </View>
        <Text style={[followStyles.seeAll, { color: colors.accent }]}>
          See all
        </Text>
      </View>

      {preview.map((event, i) => (
        <View key={event.id}>
          {i > 0 && (
            <View
              style={[
                followStyles.separator,
                { backgroundColor: colors.border },
              ]}
            />
          )}
          <View style={followStyles.eventRow}>
            <Image
              source={{ uri: event.actor.avatar_url }}
              style={followStyles.avatar}
              contentFit="cover"
              transition={100}
            />
            <View style={followStyles.eventContent}>
              <Text
                style={[
                  followStyles.eventText,
                  { color: colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {getFollowingEventText(event)}
              </Text>
              <Text
                style={[followStyles.timeText, { color: colors.textMuted }]}
              >
                {compactTimeAgo(event.created_at)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </Pressable>
  );
}

const followStyles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.label,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.label,
  },
  seeAll: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.lg,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  eventContent: {
    flex: 1,
    gap: 1,
  },
  eventText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    lineHeight: FontSize.caption * 1.4,
  },
  timeText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },
});

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
  const storeUser = useAuthStore((s) => s.user);
  const pat = useAuthStore((s) => s.pat);
  const { data: pinnedRepos, isLoading: pinnedLoading } = usePinnedRepos();
  const {
    weeks,
    totalContributions,
    stats,
    isLoading: contribLoading,
  } = useContributions();
  const eventsUsername = user?.login ?? storeUser?.login ?? "";
  const {
    events,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: activityLoading,
  } = useEvents(eventsUsername);
  const { events: followingEvents, isLoading: followingLoading } =
    useReceivedEvents();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.pinned() });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.contributions(),
    });
    const username = user?.login || storeUser?.login;
    if (username) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.events(username),
      });
    }
    setRefreshing(false);
  }, [queryClient, user?.login, storeUser?.login]);

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
            <Text style={s.userName}>
              {user?.name ||
                storeUser?.name ||
                user?.login ||
                storeUser?.login ||
                "..."}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/(app)/(tabs)/profile" as Href)}
            onPressIn={handleAvatarPressIn}
            hitSlop={8}
          >
            {user?.avatar_url || storeUser?.avatar_url ? (
              <Image
                source={{ uri: user?.avatar_url || storeUser?.avatar_url }}
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

        {pat && (
          <FollowingPreview
            events={followingEvents}
            isLoading={followingLoading}
            onPress={() => router.push("/(app)/(tabs)/overview/feed" as Href)}
            colors={colors}
          />
        )}

        <View style={s.section}>
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

    sectionTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
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
