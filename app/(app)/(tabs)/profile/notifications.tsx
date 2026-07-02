import { Octicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Href, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FlashList } from "@shopify/flash-list";

import { ListItemSeparator } from "@/components/shared/ListItemSeparator";
import { useNotifications } from "@/hooks/useNotifications";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth.store";

import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";
import type { GitHubNotification } from "@/types/github.types";

const ATTENTION_REASONS = new Set([
  "review_requested",
  "mention",
  "assign",
  "ci_activity",
  "your_activity",
  "team_mention",
]);

const REASON_ICONS: Record<string, keyof typeof Octicons.glyphMap> = {
  review_requested: "code-review",
  mention: "mention",
  assign: "person",
  ci_activity: "check",
  subscribed: "eye",
  your_activity: "pulse",
  team_mention: "people",
  invite: "organization",
  manual: "bell",
};

const TYPE_ICONS: Record<string, keyof typeof Octicons.glyphMap> = {
  Issue: "issue-opened",
  PullRequest: "git-pull-request",
  Discussion: "comment-discussion",
  CheckRun: "check-circle",
  Commit: "git-commit",
  Release: "tag",
  DiscussionComment: "comment",
};

function extractRepoName(fullName: string): string {
  return fullName.split("/").pop() ?? fullName;
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;

  const months = Math.floor(days / 30);
  return `${months}mo`;
}

function NotificationItem({
  notification,
  onPress,
  colors,
}: {
  notification: GitHubNotification;
  onPress: () => void;
  colors: ColorTokens;
}) {
  const isAttention = ATTENTION_REASONS.has(notification.reason);
  const typeIcon = TYPE_ICONS[notification.subject.type] ?? "dot-fill";
  const reasonIcon = REASON_ICONS[notification.reason] ?? "bell";

  const s = useMemo(() => itemStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.container, pressed && s.pressed]}
    >
      <View style={s.iconColumn}>
        <View
          style={[
            s.typeBadge,
            {
              backgroundColor: isAttention
                ? colors.accent + "20"
                : colors.surfaceSecondary,
            },
          ]}
        >
          <Octicons
            name={typeIcon}
            size={14}
            color={isAttention ? colors.accent : colors.textMuted}
          />
        </View>
        {!notification.unread && <View style={s.readDot} />}
      </View>

      <View style={s.content}>
        <Text
          style={[s.title, !notification.unread && s.titleRead]}
          numberOfLines={2}
        >
          {notification.subject.title}
        </Text>
        <View style={s.meta}>
          <Octicons
            name={reasonIcon}
            size={10}
            color={colors.textMuted}
            style={s.reasonIcon}
          />
          <Text style={s.repoName} numberOfLines={1}>
            {extractRepoName(notification.repository.full_name)}
          </Text>
          <Text style={s.dot}>{dots}</Text>
          <Text style={s.time}>{getTimeAgo(notification.updated_at)}</Text>
        </View>
      </View>

      {isAttention && (
        <View style={[s.attentionDot, { backgroundColor: colors.accent }]} />
      )}
    </Pressable>
  );
}

const dots = "\u00B7";

function itemStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
    },
    pressed: {
      backgroundColor: colors.surfaceSecondary,
    },
    iconColumn: {
      alignItems: "center",
      gap: Spacing.xs,
    },
    typeBadge: {
      width: 32,
      height: 32,
      borderRadius: Radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    readDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.textMuted,
    },
    content: {
      flex: 1,
      gap: Spacing.xs,
    },
    title: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textPrimary,
      lineHeight: FontSize.body * 1.4,
    },
    titleRead: {
      color: colors.textMuted,
    },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
    reasonIcon: {
      marginTop: 1,
    },
    repoName: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },
    dot: {
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },
    time: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },
    attentionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
    },
  });
}

const FILTERS = ["all", "unread", "attention"] as const;
type Filter = (typeof FILTERS)[number];

function getFilteredNotifications(
  notifications: GitHubNotification[],
  filter: Filter,
): GitHubNotification[] {
  switch (filter) {
    case "unread":
      return notifications.filter((n) => n.unread);
    case "attention":
      return notifications.filter(
        (n) => n.unread && ATTENTION_REASONS.has(n.reason),
      );
    case "all":
    default:
      return notifications;
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const pat = useAuthStore((s) => s.pat);

  const {
    notifications,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useNotifications();

  const filtered = useMemo(
    () => getFilteredNotifications(notifications, filter),
    [notifications, filter],
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications],
  );

  const attentionCount = useMemo(
    () =>
      notifications.filter((n) => n.unread && ATTENTION_REASONS.has(n.reason))
        .length,
    [notifications],
  );

  const handleNotificationPress = useCallback(
    async (notification: GitHubNotification) => {
      if (notification.unread) {
        await markNotificationAsRead(notification.id, pat);
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.notifications(), pat ? "pat" : "oauth"],
        });
      }

      if (notification.subject.url) {
        const url = notification.subject.url;
        const match = url.match(
          /\/repos\/([^/]+)\/([^/]+)\/(pulls|issues)\/(\d+)/,
        );
        if (match) {
          const [, owner, repo, type, number] = match;
          const route =
            type === "pulls"
              ? `/(app)/repo/${owner}~~${repo}/pr/${number}`
              : `/(app)/repo/${owner}~~${repo}/issue/${number}`;
          router.push(route as Href);
          return;
        }

        const commitMatch = url.match(
          /\/repos\/([^/]+)\/([^/]+)\/commits\/([a-f0-9]+)/,
        );
        if (commitMatch) {
          router.push(
            `/(app)/repo/${commitMatch[1]}~~${commitMatch[2]}` as Href,
          );
          return;
        }

        const repoMatch = url.match(/\/repos\/([^/]+)\/([^/]+)$/);
        if (repoMatch) {
          router.push(`/(app)/repo/${repoMatch[1]}~~${repoMatch[2]}` as Href);
          return;
        }
      }
    },
    [queryClient, router, pat],
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllNotificationsAsRead(pat);
    queryClient.invalidateQueries({
      queryKey: [...queryKeys.notifications(), pat ? "pat" : "oauth"],
    });
  }, [queryClient, pat]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: [...queryKeys.notifications(), pat ? "pat" : "oauth"],
    });
    setRefreshing(false);
  }, [queryClient, pat]);

  const keyExtractor = useCallback((item: GitHubNotification) => item.id, []);

  const s = useMemo(() => buildStyles(colors, isDark), [colors, isDark]);

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
      <View style={s.header}>
        <View style={s.headerRow}>
          <View>
            {unreadCount > 0 && (
              <Text style={s.subtitle}>
                {unreadCount} unread
                {attentionCount > 0
                  ? ` \u00B7 ${attentionCount} attention`
                  : ""}
              </Text>
            )}
          </View>
          {unreadCount > 0 && (
            <Pressable onPress={handleMarkAllRead} style={s.markAllBtn}>
              <Text style={s.markAllText}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        <View style={s.filterRow}>
          {FILTERS.map((f) => {
            const count =
              f === "unread"
                ? unreadCount
                : f === "attention"
                  ? attentionCount
                  : notifications.length;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[s.filterPill, filter === f && s.filterPillActive]}
              >
                <Text
                  style={[s.filterText, filter === f && s.filterTextActive]}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
                {count > 0 && (
                  <View
                    style={[s.filterBadge, filter === f && s.filterBadgeActive]}
                  >
                    <Text
                      style={[
                        s.filterBadgeText,
                        filter === f && s.filterBadgeTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {isError ? (
        <View style={s.emptyContainer}>
          <Octicons name="alert" size={48} color={colors.danger} />
          <Text style={s.emptyTitle}>Couldn{"'"}t load notifications</Text>
          <Text style={s.emptySubtitle}>
            {error?.message || "Something went wrong. Please try again later."}
          </Text>
        </View>
      ) : isLoading ? (
        <View style={s.skeletonContainer}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={s.skeletonRow}>
              <View style={s.skeletonIcon} />
              <View style={s.skeletonContent}>
                <View style={s.skeletonTitle} />
                <View style={s.skeletonMeta} />
              </View>
            </View>
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.emptyContainer}>
          <Octicons name="bell-slash" size={48} color={colors.textMuted} />
          <Text style={s.emptyTitle}>No notifications</Text>
          <Text style={s.emptySubtitle}>
            {filter === "unread"
              ? "You're all caught up!"
              : filter === "attention"
                ? "No attention-worthy items right now."
                : "When you get notifications, they'll show up here."}
          </Text>
        </View>
      ) : (
        <FlashList
          data={filtered}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => handleNotificationPress(item)}
              colors={colors}
            />
          )}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ListItemSeparator}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          removeClippedSubviews
          drawDistance={200}
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

function buildStyles(colors: ColorTokens, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      backgroundColor: colors.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: Spacing.md,
    },
    subtitle: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    markAllBtn: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.sm,
      backgroundColor: colors.surfaceSecondary,
    },
    markAllText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.accent,
    },
    filterRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    filterPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.full,
      backgroundColor: colors.surfaceSecondary,
    },
    filterPillActive: {
      backgroundColor: colors.accent,
    },
    filterText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },
    filterTextActive: {
      color: isDark ? colors.background : "#fff",
    },
    filterBadge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
      backgroundColor: colors.border,
    },
    filterBadgeActive: {
      backgroundColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)",
    },
    filterBadgeText: {
      fontFamily: FontFamily.semiBold,
      fontSize: 10,
      color: colors.textMuted,
    },
    filterBadgeTextActive: {
      color: isDark ? colors.background : "#fff",
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
    skeletonIcon: {
      width: 32,
      height: 32,
      borderRadius: Radius.md,
      backgroundColor: colors.surfaceSecondary,
    },
    skeletonContent: {
      flex: 1,
      gap: Spacing.sm,
    },
    skeletonTitle: {
      height: 16,
      width: "70%",
      borderRadius: Radius.sm,
      backgroundColor: colors.surfaceSecondary,
    },
    skeletonMeta: {
      height: 12,
      width: "40%",
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
