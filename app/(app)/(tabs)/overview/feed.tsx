import { Octicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { type Href, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";

import { ListItemSeparator } from "@/components/shared/ListItemSeparator";
import { useReceivedEvents } from "@/hooks/useReceivedEvents";
import { getEventDisplay } from "@/lib/github-utils";
import { queryKeys } from "@/lib/query-client";
import { parseGitHubUrl } from "@/lib/github-url";
import { compactTimeAgo } from "@/lib/utils";
import type { GitHubEvent } from "@/types/github.types";

import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";

function EventItem({
  event,
  colors,
  onPress,
}: {
  event: GitHubEvent;
  colors: ColorTokens;
  onPress: (url: string) => void;
}) {
  const display = getEventDisplay(event, colors);
  const s = useMemo(() => itemStyles(colors), [colors]);

  if (!display) return null;

  return (
    <Pressable
      style={({ pressed }) => [s.container, pressed && s.pressed]}
      onPress={() => onPress(display.url)}
    >
      <Image
        source={{ uri: event.actor.avatar_url }}
        style={s.avatar}
        contentFit="cover"
        transition={200}
      />
      <View style={s.content}>
        <View style={s.header}>
          <Text style={s.actor} numberOfLines={1}>
            {event.actor.login}
          </Text>
          <Text style={s.time}>{compactTimeAgo(event.created_at)}</Text>
        </View>
        <View style={s.eventRow}>
          <View
            style={[s.iconBadge, { backgroundColor: display.iconColor + "20" }]}
          >
            <Octicons name={display.icon} size={12} color={display.iconColor} />
          </View>
          <Text style={s.eventText} numberOfLines={2}>
            {display.primaryText} to {display.secondaryText}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function itemStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
    },
    pressed: {
      backgroundColor: colors.surfaceSecondary,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    content: {
      flex: 1,
      gap: Spacing.xs,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    actor: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
      flex: 1,
    },
    time: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },
    eventRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    iconBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    eventText: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textSecondary,
      lineHeight: FontSize.label * 1.4,
    },
  });
}

export default function FollowingFeedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const {
    events,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useReceivedEvents();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.receivedEvents(),
    });
    setRefreshing(false);
  }, [queryClient]);

  const handleEventPress = useCallback(
    (url: string) => {
      const route = parseGitHubUrl(url);
      if (route) {
        router.push(route as Href);
      }
    },
    [router],
  );

  const keyExtractor = useCallback((item: GitHubEvent) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: GitHubEvent }) => (
      <EventItem event={item} colors={colors} onPress={handleEventPress} />
    ),
    [colors, handleEventPress],
  );

  const s = useMemo(() => buildStyles(colors), [colors]);

  const hasInitialLoad = useRef(false);

  const handleEndReached = useCallback(() => {
    if (!hasInitialLoad.current) {
      hasInitialLoad.current = true;
      return;
    }
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View style={s.container}>
      {isError ? (
        <View style={s.emptyContainer}>
          <Octicons name="alert" size={48} color={colors.danger} />
          <Text style={s.emptyTitle}>Couldn{"'"}t load activity</Text>
          <Text style={s.emptySubtitle}>
            {error?.message || "Something went wrong. Please try again later."}
          </Text>
        </View>
      ) : isLoading ? (
        <View style={s.skeletonContainer}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={s.skeletonRow}>
              <View style={s.skeletonAvatar} />
              <View style={s.skeletonContent}>
                <View style={s.skeletonHeader} />
                <View style={s.skeletonEvent} />
              </View>
            </View>
          ))}
        </View>
      ) : events.length === 0 ? (
        <View style={s.emptyContainer}>
          <Octicons name="people" size={48} color={colors.textMuted} />
          <Text style={s.emptyTitle}>No activity yet</Text>
          <Text style={s.emptySubtitle}>
            Follow users on GitHub to see their activity here
          </Text>
        </View>
      ) : (
        <FlashList
          data={events}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ListItemSeparator}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          removeClippedSubviews
          drawDistance={400}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          contentContainerStyle={s.listContent}
        />
      )}
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
      paddingBottom: Spacing.xxl,
    },
    skeletonContainer: {
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    skeletonRow: {
      flexDirection: "row",
      gap: Spacing.md,
      paddingVertical: Spacing.md,
    },
    skeletonAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceSecondary,
    },
    skeletonContent: {
      flex: 1,
      gap: Spacing.sm,
    },
    skeletonHeader: {
      height: 14,
      width: "40%",
      borderRadius: Radius.sm,
      backgroundColor: colors.surfaceSecondary,
    },
    skeletonEvent: {
      height: 12,
      width: "70%",
      borderRadius: Radius.sm,
      backgroundColor: colors.surfaceSecondary,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.md,
      paddingBottom: Spacing["4xl"],
    },
    emptyTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
    },
    emptySubtitle: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textMuted,
      textAlign: "center",
      maxWidth: 260,
    },
  });
}
