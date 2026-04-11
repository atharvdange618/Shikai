import { Octicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { useCommits } from "@/hooks/useRepoDetails";
import { queryKeys } from "@/lib/query-client";
import type { GitHubCommit } from "@/types/github.types";

import {
  AvatarSize,
  DarkColors,
  FontFamily,
  FontSize,
  Layout,
  LightColors,
  Radius,
  Shadows,
  Spacing,
} from "@/constants/theme";
import { relativeTime } from "@/lib/utils";

export default function CommitsScreen() {
  const { repoId } = useLocalSearchParams<{ repoId: string }>();
  const queryClient = useQueryClient();
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const shadows = useMemo(() => (isDark ? {} : Shadows.light.sm), [isDark]);

  const [owner, repoName] = (repoId ?? "").split("__");

  const {
    commits,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useCommits(owner, repoName);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.repoCommits(owner, repoName),
    });
    setRefreshing(false);
  }, [queryClient, owner, repoName]);

  const renderItem = useCallback(
    ({ item }: { item: GitHubCommit }) => (
      <CommitItem commit={item} colors={colors} shadows={shadows} />
    ),
    [colors, shadows],
  );

  const keyExtractor = useCallback((item: GitHubCommit) => item.sha, []);

  const s = buildStyles(colors);

  const ListFooter = isFetchingNextPage ? (
    <View style={s.footerLoader}>
      <ActivityIndicator size="small" color={colors.accent} />
    </View>
  ) : null;

  const ListEmpty = isLoading ? null : (
    <View style={s.emptyContainer}>
      {isError ? (
        <>
          <Octicons name="alert" size={24} color={colors.danger} />
          <Text style={s.emptyTitle}>Failed to load commits</Text>
          <Pressable style={s.retryButton} onPress={() => refetch()}>
            <Text style={s.retryText}>Try again</Text>
          </Pressable>
        </>
      ) : (
        <Text style={s.emptyTitle}>No commits found</Text>
      )}
    </View>
  );

  return (
    <View style={s.container}>
      <FlashList
        data={commits}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.listContent}
        ItemSeparatorComponent={() => <View style={s.separator} />}
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
        drawDistance={200}
      />
    </View>
  );
}

const CommitItem = memo(function CommitItem({
  commit,
  colors,
  shadows,
}: {
  commit: GitHubCommit;
  colors: typeof LightColors | typeof DarkColors;
  shadows: object;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(commit.sha);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [commit.sha]);

  const subject = commit.commit.message.split("\n")[0];
  const authorName = commit.commit.author.name;
  const timestamp = relativeTime(commit.commit.author.date);
  const avatarUrl = commit.author?.avatar_url;

  const s = buildStyles(colors);

  return (
    <View style={[s.item, shadows]}>
      <View style={s.avatarWrap}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={s.avatar}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={[s.avatar, s.avatarFallback]}>
            <Octicons name="person" size={12} color={colors.textMuted} />
          </View>
        )}
      </View>

      <View style={s.textBlock}>
        <Text style={s.message} numberOfLines={2}>
          {subject}
        </Text>
        <Text style={s.meta} numberOfLines={1}>
          {authorName}
          <Text style={s.metaDot}> · </Text>
          {timestamp}
        </Text>
      </View>

      <Pressable
        onPress={handleCopy}
        hitSlop={8}
        style={({ pressed }) => [s.shaBadge, pressed && s.shaBadgePressed]}
      >
        <Octicons
          name={copied ? "check" : "copy"}
          size={10}
          color={copied ? colors.success : colors.textMuted}
        />
        <Text style={[s.shaText, copied && s.shaTextCopied]}>
          {copied ? "Copied" : commit.sha.slice(0, 7)}
        </Text>
      </Pressable>
    </View>
  );
});

function buildStyles(colors: typeof LightColors | typeof DarkColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    listContent: {
      paddingHorizontal: Layout.screenPadding,
      paddingVertical: Spacing.md,
      paddingBottom: Spacing.xxl,
    },

    item: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
    },

    avatarWrap: {
      flexShrink: 0,
      marginTop: 1,
    },

    avatar: {
      width: AvatarSize.sm,
      height: AvatarSize.sm,
      borderRadius: AvatarSize.sm / 2,
      borderWidth: 1,
      borderColor: colors.border,
    },

    avatarFallback: {
      backgroundColor: colors.surfaceSecondary,
      alignItems: "center",
      justifyContent: "center",
    },

    textBlock: {
      flex: 1,
      gap: 4,
    },

    message: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textPrimary,
      lineHeight: FontSize.label * 1.5,
    },

    meta: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
    },

    metaDot: {
      color: colors.textMuted,
    },

    shaBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      flexShrink: 0,
      marginTop: 1,
    },

    shaBadgePressed: {
      opacity: 0.6,
    },

    shaText: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
    },

    shaTextCopied: {
      color: colors.success,
    },

    separator: {
      height: Spacing.sm,
    },

    emptyContainer: {
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
