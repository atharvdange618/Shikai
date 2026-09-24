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

import { useWorkflowRuns } from "@/hooks/useActions";
import { queryKeys } from "@/lib/query-client";
import { getRunDisplay } from "@/lib/run-display";
import type { GitHubWorkflowRun } from "@/types/github.types";

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

const keyExtractor = (item: GitHubWorkflowRun) => String(item.id);

export default function ActionsScreen() {
  const { repoId } = useLocalSearchParams<{ repoId: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const [refreshing, setRefreshing] = useState(false);

  const {
    runs,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useWorkflowRuns(owner, repoName);

  useEffect(() => {
    try {
      navigation.setOptions({
        title: "Actions",
        headerRight: () => (
          <Pressable
            hitSlop={12}
            style={{ marginRight: Spacing.sm, padding: Spacing.xs }}
            onPress={() =>
              WebBrowser.openBrowserAsync(
                `https://github.com/${owner}/${repoName}/actions`,
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
      queryKey: queryKeys.workflowRuns(owner, repoName),
    });
    setRefreshing(false);
  }, [queryClient, owner, repoName]);

  const renderItem = useCallback(
    ({ item }: { item: GitHubWorkflowRun }) => (
      <RunItem run={item} colors={colors} repoId={repoId ?? ""} />
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
      <Text style={s.emptyTitle}>Failed to load workflow runs</Text>
      <Pressable style={s.retryButton} onPress={() => refetch()}>
        <Text style={s.retryText}>Try again</Text>
      </Pressable>
    </View>
  ) : (
    <View style={s.centered}>
      <Octicons name="play" size={32} color={colors.textMuted} />
      <Text style={s.emptyTitle}>No workflow runs yet</Text>
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
        data={runs}
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

const RunItem = memo(function RunItem({
  run,
  colors,
  repoId,
}: {
  run: GitHubWorkflowRun;
  colors: ColorTokens;
  repoId: string;
}) {
  const router = useRouter();
  const s = useMemo(() => buildStyles(colors), [colors]);
  const status = getRunDisplay(run.status, run.conclusion, colors);

  const handlePress = useCallback(() => {
    router.push({
      pathname: "/(app)/repo/[repoId]/run/[runId]",
      params: { repoId, runId: String(run.id) },
    });
  }, [router, repoId, run.id]);

  return (
    <Pressable
      style={({ pressed }) => [s.item, pressed && s.itemPressed]}
      onPress={handlePress}
      accessibilityLabel={`${run.display_title}, ${status.label}`}
    >
      <View style={s.itemIcon}>
        <Octicons name={status.icon} size={16} color={status.color} />
      </View>

      <View style={s.itemBody}>
        <Text style={s.itemTitle} numberOfLines={2}>
          {run.display_title}
        </Text>
        <Text style={s.itemMetaText} numberOfLines={1}>
          {run.name ?? "Workflow"} #{run.run_number}
        </Text>
        <View style={s.metaRow}>
          {run.head_branch && (
            <View style={s.branchPill}>
              <Text style={s.branchText} numberOfLines={1}>
                {run.head_branch}
              </Text>
            </View>
          )}
          <Text style={s.itemMetaText} numberOfLines={1}>
            {run.event} · {relativeTime(run.created_at)}
          </Text>
        </View>
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
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: Spacing.xs,
    },
    branchPill: {
      backgroundColor: colors.accentSubtle,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.xs + 2,
      paddingVertical: 2,
      maxWidth: 180,
    },
    branchText: {
      fontFamily: FontFamily.mono,
      fontSize: 10,
      color: colors.accent,
    },
    itemMetaText: {
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
