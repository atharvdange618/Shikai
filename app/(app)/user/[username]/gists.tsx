import { Octicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ListItemSeparator } from "@/components/shared/ListItemSeparator";
import { useGists } from "@/hooks/useGists";
import { queryKeys } from "@/lib/query-client";
import { relativeTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import type { GitHubGist } from "@/types/github.types";

import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";

const keyExtractor = (item: GitHubGist) => item.id;

export default function GistsScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const myLogin = useAuthStore((s) => s.user?.login);
  const isSelf = Boolean(myLogin && myLogin === username);

  const [refreshing, setRefreshing] = useState(false);

  const {
    gists,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useGists(username ?? "", isSelf);

  useEffect(() => {
    try {
      navigation.setOptions({ title: "Gists" });
    } catch {
      /* navigator not ready yet */
    }
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.gists(username ?? ""),
    });
    setRefreshing(false);
  }, [queryClient, username]);

  const renderItem = useCallback(
    ({ item }: { item: GitHubGist }) => (
      <GistItem gist={item} colors={colors} username={username ?? ""} />
    ),
    [colors, username],
  );

  const s = useMemo(() => buildStyles(colors), [colors]);

  const ListEmpty = isLoading ? (
    <View style={s.centered}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  ) : isError ? (
    <View style={s.centered}>
      <Octicons name="alert" size={24} color={colors.danger} />
      <Text style={s.emptyTitle}>Failed to load gists</Text>
      <Pressable style={s.retry} onPress={() => refetch()}>
        <Text style={s.retryText}>Try again</Text>
      </Pressable>
    </View>
  ) : (
    <View style={s.centered}>
      <Octicons name="code" size={32} color={colors.textMuted} />
      <Text style={s.emptyTitle}>No public gists</Text>
    </View>
  );

  return (
    <View style={s.container}>
      <FlashList
        data={gists}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.listContent}
        ItemSeparatorComponent={ListItemSeparator}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={s.footerLoader}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null
        }
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

const GistItem = memo(function GistItem({
  gist,
  colors,
  username,
}: {
  gist: GitHubGist;
  colors: ColorTokens;
  username: string;
}) {
  const router = useRouter();
  const s = useMemo(() => buildStyles(colors), [colors]);

  const filenames = Object.keys(gist.files);
  const title = gist.description?.trim() || filenames[0] || "Untitled gist";

  const handlePress = useCallback(() => {
    router.push({
      pathname: "/(app)/user/[username]/gist/[id]",
      params: { username, id: gist.id },
    });
  }, [router, username, gist.id]);

  return (
    <Pressable
      style={({ pressed }) => [s.item, pressed && s.itemPressed]}
      onPress={handlePress}
    >
      <View style={s.itemIcon}>
        <Octicons
          name={gist.public ? "code" : "lock"}
          size={16}
          color={colors.textMuted}
        />
      </View>
      <View style={s.itemBody}>
        <Text style={s.itemTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={s.itemMeta} numberOfLines={1}>
          {filenames.length} file{filenames.length === 1 ? "" : "s"} ·{" "}
          {relativeTime(gist.updated_at)}
        </Text>
      </View>
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
    itemMeta: {
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
    retry: {
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
