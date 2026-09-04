import { ListItemSeparator } from "@/components/shared/ListItemSeparator";
import { Octicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
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

import { useReleases } from "@/hooks/useReleases";
import { queryKeys } from "@/lib/query-client";
import type { GitHubRelease } from "@/types/github.types";

import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";
import { decodeRepoId, relativeTime } from "@/lib/utils";

const keyExtractor = (item: GitHubRelease) => String(item.id);

export default function ReleasesScreen() {
  const { repoId } = useLocalSearchParams<{ repoId: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const [refreshing, setRefreshing] = useState(false);

  const {
    releases,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useReleases(owner, repoName);

  const latestTag = useMemo(
    () => releases.find((r) => !r.prerelease)?.tag_name ?? null,
    [releases],
  );

  useEffect(() => {
    try {
      navigation.setOptions({
        title: "Releases",
        headerRight: () => (
          <Pressable
            hitSlop={12}
            style={{ marginRight: Spacing.sm, padding: Spacing.xs }}
            onPress={() =>
              WebBrowser.openBrowserAsync(
                `https://github.com/${owner}/${repoName}/releases`,
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
      queryKey: queryKeys.repoReleases(owner, repoName),
    });
    setRefreshing(false);
  }, [queryClient, owner, repoName]);

  const renderItem = useCallback(
    ({ item }: { item: GitHubRelease }) => (
      <ReleaseItem
        release={item}
        isLatest={item.tag_name === latestTag}
        colors={colors}
        repoId={repoId ?? ""}
      />
    ),
    [colors, repoId, latestTag],
  );

  const s = useMemo(() => buildStyles(colors), [colors]);

  const ListEmpty = isLoading ? (
    <View style={s.centered}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  ) : isError ? (
    <View style={s.centered}>
      <Octicons name="alert" size={24} color={colors.danger} />
      <Text style={s.emptyTitle}>Failed to load releases</Text>
      <Pressable style={s.retryButton} onPress={() => refetch()}>
        <Text style={s.retryText}>Try again</Text>
      </Pressable>
    </View>
  ) : (
    <View style={s.centered}>
      <Octicons name="tag" size={32} color={colors.textMuted} />
      <Text style={s.emptyTitle}>No releases yet</Text>
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
        data={releases}
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

const ReleaseItem = memo(function ReleaseItem({
  release,
  isLatest,
  colors,
  repoId,
}: {
  release: GitHubRelease;
  isLatest: boolean;
  colors: ColorTokens;
  repoId: string;
}) {
  const router = useRouter();
  const s = useMemo(() => buildStyles(colors), [colors]);

  const handlePress = useCallback(() => {
    router.push({
      pathname: "/(app)/repo/[repoId]/release/[tag]",
      params: { repoId, tag: release.tag_name },
    });
  }, [router, repoId, release.tag_name]);

  return (
    <Pressable
      style={({ pressed }) => [s.item, pressed && s.itemPressed]}
      onPress={handlePress}
    >
      <View style={s.itemIcon}>
        <Octicons name="tag" size={16} color={colors.textMuted} />
      </View>

      <View style={s.itemBody}>
        <Text style={s.itemTitle} numberOfLines={2}>
          {release.name?.trim() || release.tag_name}
        </Text>

        <View style={s.badgeRow}>
          {isLatest && (
            <View style={[s.badge, { backgroundColor: colors.accentSubtle }]}>
              <Text style={[s.badgeText, { color: colors.accent }]}>Latest</Text>
            </View>
          )}
          {release.prerelease && (
            <View
              style={[s.badge, { backgroundColor: colors.surfaceSecondary }]}
            >
              <Text style={[s.badgeText, { color: colors.warning }]}>
                Pre-release
              </Text>
            </View>
          )}
          <Text style={s.itemMetaText} numberOfLines={1}>
            {release.tag_name} · {relativeTime(release.published_at)}
          </Text>
        </View>
      </View>

      {release.assets.length > 0 && (
        <View style={s.assetsRow}>
          <Octicons name="package" size={12} color={colors.textMuted} />
          <Text style={s.assetsText}>{release.assets.length}</Text>
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
      paddingVertical: Spacing.md,
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
      flexWrap: "wrap",
      gap: Spacing.xs,
    },
    badge: {
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.xs + 2,
      paddingVertical: 2,
    },
    badgeText: {
      fontFamily: FontFamily.medium,
      fontSize: 10,
    },
    itemMetaText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },
    assetsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      flexShrink: 0,
      marginTop: 2,
    },
    assetsText: {
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
