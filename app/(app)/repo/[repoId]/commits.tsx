import { CommitCard } from "@/components/repo/CommitCard";
import { ListItemSeparator } from "@/components/shared/ListItemSeparator";
import { Octicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useBranches, useCommits, useRepo } from "@/hooks/useRepoDetails";
import { queryKeys } from "@/lib/query-client";
import type { GitHubCommit } from "@/types/github.types";

import { BranchSelector } from "@/components/repo/BranchSelector";
import { PullToRefresh } from "@/components/shared/PullToRefresh";
import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";
import { decodeRepoId } from "@/lib/utils";

const keyExtractor = (item: GitHubCommit) => item.sha;

export default function CommitsScreen() {
  const { repoId, path, fileName } = useLocalSearchParams<{
    repoId: string;
    path?: string;
    fileName?: string;
  }>();
  const isFileHistory = Boolean(path);
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const [selectedBranch, setSelectedBranch] = useState("");

  const { data: repo } = useRepo(owner, repoName);
  const { data: branches, isLoading: branchesLoading } = useBranches(owner, repoName);

  // Default to the repo's default branch until the user picks one. Set
  // during render, not in an effect, so it never cascades an extra render.
  if (repo?.default_branch && !selectedBranch) {
    setSelectedBranch(repo.default_branch);
  }

  useEffect(() => {
    if (!isFileHistory) return;
    try {
      navigation.setOptions({ title: fileName ?? "History" });
    } catch {}
  }, [navigation, isFileHistory, fileName]);

  const { commits, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useCommits(owner, repoName, selectedBranch, path);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.repoCommits(owner, repoName),
    });
    setRefreshing(false);
  }, [queryClient, owner, repoName]);

  const renderItem = useCallback(
    ({ item }: { item: GitHubCommit }) => <CommitCard commit={item} repoId={repoId ?? ""} />,
    [repoId],
  );

  const s = useMemo(() => buildStyles(colors), [colors]);

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
      {!isFileHistory && (
        <BranchSelector
          branches={branches ?? []}
          selectedBranch={selectedBranch}
          onBranchChange={(branch) => {
            setSelectedBranch(branch);
          }}
          isLoading={branchesLoading}
          onCompare={(head) =>
            router.push({
              pathname: "/(app)/repo/[repoId]/compare",
              params: { repoId: repoId ?? "", base: selectedBranch, head },
            })
          }
        />
      )}
      <FlashList
        data={commits}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.listContent}
        ItemSeparatorComponent={ListItemSeparator}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        onEndReached={() => {
          if (hasNextPage) void fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={<PullToRefresh refreshing={refreshing} onRefresh={onRefresh} />}
        removeClippedSubviews
        drawDistance={200}
      />
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
      paddingHorizontal: Layout.screenPadding,
      paddingVertical: Spacing.md,
      paddingBottom: Spacing.xxl,
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
