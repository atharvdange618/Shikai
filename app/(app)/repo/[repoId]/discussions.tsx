import { ListItemSeparator } from "@/components/shared/ListItemSeparator";
import { Octicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useDiscussions } from "@/hooks/useDiscussions";
import { queryKeys } from "@/lib/query-client";
import type { DiscussionListNode } from "@/types/github-graphql.types";

import {
  AvatarSize,
  type ColorTokens,
  FontFamily,
  FontSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";
import { decodeRepoId, relativeTime } from "@/lib/utils";

const keyExtractor = (item: DiscussionListNode) => item.id;

export default function DiscussionsScreen() {
  const { repoId } = useLocalSearchParams<{ repoId: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const [refreshing, setRefreshing] = useState(false);

  const {
    discussions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useDiscussions(owner, repoName);

  useEffect(() => {
    try {
      navigation.setOptions({
        title: "Discussions",
        headerRight: () => (
          <Pressable
            hitSlop={12}
            style={{ marginRight: Spacing.sm, padding: Spacing.xs }}
            onPress={() =>
              WebBrowser.openBrowserAsync(
                `https://github.com/${owner}/${repoName}/discussions`,
              )
            }
          >
            <Octicons name="link-external" size={16} color={colors.accent} />
          </Pressable>
        ),
      });
    } catch {
      /* navigator not ready yet */
    }
  }, [navigation, owner, repoName, colors.accent]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.repoDiscussions(owner, repoName),
    });
    setRefreshing(false);
  }, [queryClient, owner, repoName]);

  const renderItem = useCallback(
    ({ item }: { item: DiscussionListNode }) => (
      <DiscussionItem discussion={item} colors={colors} repoId={repoId ?? ""} />
    ),
    [colors, repoId],
  );

  const s = useMemo(() => buildStyles(colors), [colors]);

  const ListEmpty = isLoading ? (
    <View style={s.centered}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  ) : isError ? (
    <View style={s.centered}>
      <Octicons name="alert" size={24} color={colors.danger} />
      <Text style={s.emptyTitle}>Failed to load discussions</Text>
      <Pressable style={s.retryButton} onPress={() => refetch()}>
        <Text style={s.retryText}>Try again</Text>
      </Pressable>
    </View>
  ) : (
    <View style={s.centered}>
      <Octicons
        name="comment-discussion"
        size={32}
        color={colors.textMuted}
      />
      <Text style={s.emptyTitle}>No discussions</Text>
    </View>
  );

  const ListFooter = isFetchingNextPage ? (
    <View style={s.footerLoader}>
      <ActivityIndicator size="small" color={colors.accent} />
    </View>
  ) : null;

  return (
    <View style={s.container}>
      <FlashList
        data={discussions}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        removeClippedSubviews
        drawDistance={300}
      />
    </View>
  );
}

const DiscussionItem = memo(function DiscussionItem({
  discussion,
  colors,
  repoId,
}: {
  discussion: DiscussionListNode;
  colors: ColorTokens;
  repoId: string;
}) {
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push({
      pathname: "/(app)/repo/[repoId]/discussion/[number]",
      params: { repoId, number: String(discussion.number) },
    });
  }, [router, repoId, discussion.number]);

  const s = useMemo(() => buildStyles(colors), [colors]);

  return (
    <Pressable
      style={({ pressed }) => [s.item, pressed && s.itemPressed]}
      onPress={handlePress}
    >
      <View style={s.itemIcon}>
        <Octicons
          name="comment-discussion"
          size={16}
          color={discussion.isAnswered ? colors.success : colors.textMuted}
        />
      </View>

      <View style={s.itemBody}>
        <Text style={s.itemTitle} numberOfLines={2}>
          {discussion.title}
        </Text>

        <View style={s.badgeRow}>
          <View style={s.categoryPill}>
            <Text style={s.categoryText} numberOfLines={1}>
              {discussion.category.emoji} {discussion.category.name}
            </Text>
          </View>
          {discussion.isAnswered && (
            <View style={s.answeredPill}>
              <Octicons name="check" size={10} color={colors.success} />
              <Text style={s.answeredText}>Answered</Text>
            </View>
          )}
        </View>

        <View style={s.itemMeta}>
          {discussion.author?.avatarUrl ? (
            <Image
              source={{ uri: discussion.author.avatarUrl }}
              style={s.authorAvatar}
              contentFit="cover"
              transition={100}
            />
          ) : null}
          <Text style={s.itemMetaText} numberOfLines={1}>
            #{discussion.number} · {discussion.author?.login ?? "ghost"} ·{" "}
            {relativeTime(discussion.createdAt)}
          </Text>
        </View>
      </View>

      {discussion.comments.totalCount > 0 && (
        <View style={s.commentsRow}>
          <Octicons name="comment" size={12} color={colors.textMuted} />
          <Text style={s.commentsText}>{discussion.comments.totalCount}</Text>
        </View>
      )}
    </Pressable>
  );
});

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingHorizontal: Layout.screenPadding,
      paddingTop: Spacing.xs,
      paddingBottom: Spacing.xxl,
    },
    item: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.md,
      paddingVertical: Spacing.md,
    },
    itemPressed: {
      opacity: 0.6,
    },
    itemIcon: {
      marginTop: 2,
      flexShrink: 0,
    },
    itemBody: {
      flex: 1,
      gap: Spacing.xs,
    },
    itemTitle: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textPrimary,
      lineHeight: FontSize.label * 1.5,
    },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      flexWrap: "wrap",
    },
    categoryPill: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.xs + 2,
      paddingVertical: 2,
    },
    categoryText: {
      fontFamily: FontFamily.medium,
      fontSize: 10,
      color: colors.textSecondary,
    },
    answeredPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: `${colors.success}20`,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.xs + 2,
      paddingVertical: 2,
    },
    answeredText: {
      fontFamily: FontFamily.medium,
      fontSize: 10,
      color: colors.success,
    },
    itemMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      marginTop: 2,
    },
    authorAvatar: {
      width: AvatarSize.xs - 4,
      height: AvatarSize.xs - 4,
      borderRadius: (AvatarSize.xs - 4) / 2,
    },
    itemMetaText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      flex: 1,
    },
    commentsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      flexShrink: 0,
      marginTop: 2,
    },
    commentsText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
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
    retryButton: {
      backgroundColor: colors.accent,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    retryText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: "#FFFFFF",
    },
    footerLoader: {
      paddingVertical: Spacing.lg,
      alignItems: "center",
    },
  });
}
