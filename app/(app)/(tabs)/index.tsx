import { Octicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useContributions } from "@/hooks/useContributions";
import { usePinnedRepos } from "@/hooks/usePinnedRepos";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { useUser } from "@/hooks/useUser";
import { queryKeys } from "@/lib/query-client";

import { ActivityFeed } from "@/components/overview/ActivityFeed";
import { ContributionGraph } from "@/components/overview/ContributionGraph";
import { PinnedRepoCard } from "@/components/overview/PinnedRepoCard";

import {
  DarkColors,
  FontFamily,
  FontSize,
  LightColors,
  Radius,
  Spacing,
} from "@/constants/theme";

export default function OverviewScreen() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: user } = useUser();
  const { data: pinnedRepos, isLoading: pinnedLoading } = usePinnedRepos();
  const {
    weeks,
    totalContributions,
    isLoading: contribLoading,
  } = useContributions();
  const { data: recentRepos, isLoading: activityLoading } = useRecentActivity();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.pinned() });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.contributions(),
    });
    await queryClient.invalidateQueries({
      queryKey: ["recentActivity"],
    });
    setRefreshing(false);
  }, [queryClient]);

  const s = buildStyles(colors);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <SafeAreaView style={s.safeArea} edges={["top"]}>
      <View style={s.header}>
        <View style={s.headerContent}>
          <View>
            <Text style={s.greeting}>{getGreeting()}</Text>
            <Text style={s.userName}>{user?.name || user?.login || "..."}</Text>
          </View>
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
          />
        </View>

        <View style={s.section}>
          <ActivityFeed repos={recentRepos ?? []} isLoading={activityLoading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function buildStyles(colors: typeof LightColors | typeof DarkColors) {
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
      marginBottom: Spacing.xs,
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
