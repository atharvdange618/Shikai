import { Octicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useNavigation } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { memo, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { usePullRequests } from "@/hooks/usePullRequests";
import { queryKeys } from "@/lib/query-client";
import type { GitHubLabel, GitHubPullRequest } from "@/types/github.types";

import {
  AvatarSize,
  DarkColors,
  FontFamily,
  FontSize,
  Layout,
  LightColors,
  Radius,
  Spacing,
} from "@/constants/theme";
import { relativeTime } from "@/lib/utils";

type PRState = "open" | "closed";

type PRFilter = "open" | "closed" | "merged";

export default function PullRequestsScreen() {
  const { repoId } = useLocalSearchParams<{ repoId: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;

  const [owner, repoName] = (repoId ?? "").split("__");
  const [filter, setFilter] = useState<PRFilter>("open");
  const [refreshing, setRefreshing] = useState(false);

  const apiState: PRState = filter === "open" ? "open" : "closed";

  const {
    pullRequests: allPRs,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = usePullRequests(owner, repoName, apiState);

  const pullRequests =
    filter === "merged"
      ? allPRs.filter((pr) => pr.merged_at !== null)
      : filter === "closed"
        ? allPRs.filter((pr) => pr.merged_at === null)
        : allPRs;

  useEffect(() => {
    navigation.setOptions({
      title: "Pull Requests",
      headerRight: () => (
        <Pressable
          hitSlop={12}
          style={{ marginRight: Spacing.sm, padding: Spacing.xs }}
          onPress={() =>
            WebBrowser.openBrowserAsync(
              `https://github.com/${owner}/${repoName}/pulls`,
            )
          }
        >
          <Octicons name="link-external" size={16} color={colors.accent} />
        </Pressable>
      ),
    });
  }, [navigation, owner, repoName, colors.accent]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.repoPullRequests(owner, repoName, apiState),
    });
    setRefreshing(false);
  }, [queryClient, owner, repoName, apiState]);

  const renderItem = useCallback(
    ({ item }: { item: GitHubPullRequest }) => (
      <PRItem pr={item} colors={colors} />
    ),
    [colors],
  );

  const keyExtractor = useCallback(
    (item: GitHubPullRequest) => String(item.id),
    [],
  );

  const s = buildStyles(colors);

  const ListHeader = (
    <View style={s.filterRow}>
      {(["open", "closed", "merged"] as PRFilter[]).map((f) => (
        <FilterTab
          key={f}
          label={f.charAt(0).toUpperCase() + f.slice(1)}
          active={filter === f}
          onPress={() => setFilter(f)}
          colors={colors}
        />
      ))}
    </View>
  );

  const ListEmpty = isLoading ? (
    <View style={s.centered}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  ) : isError ? (
    <View style={s.centered}>
      <Octicons name="alert" size={24} color={colors.danger} />
      <Text style={s.emptyTitle}>Failed to load pull requests</Text>
      <Pressable style={s.retryButton} onPress={() => refetch()}>
        <Text style={s.retryText}>Try again</Text>
      </Pressable>
    </View>
  ) : (
    <View style={s.centered}>
      <Octicons name="git-pull-request" size={32} color={colors.textMuted} />
      <Text style={s.emptyTitle}>No {filter} pull requests</Text>
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
        data={pullRequests}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.listContent}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        onEndReached={() => {
          if (hasNextPage && filter !== "merged") fetchNextPage();
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

const PRItem = memo(function PRItem({
  pr,
  colors,
}: {
  pr: GitHubPullRequest;
  colors: typeof LightColors | typeof DarkColors;
}) {
  const handlePress = useCallback(() => {
    Linking.openURL(pr.html_url);
  }, [pr.html_url]);

  const s = buildStyles(colors);

  const isMerged = pr.merged_at !== null;
  const isOpen = pr.state === "open";

  let iconName: React.ComponentProps<typeof Octicons>["name"] =
    "git-pull-request";
  let iconColor: string = colors.success;

  if (pr.draft) {
    iconName = "git-pull-request-draft";
    iconColor = colors.textMuted;
  } else if (isMerged) {
    iconName = "git-merge";
    iconColor = colors.merged;
  } else if (!isOpen) {
    iconName = "git-pull-request-closed";
    iconColor = colors.danger;
  }

  const totalComments = pr.comments + pr.review_comments;

  return (
    <Pressable
      style={({ pressed }) => [s.item, pressed && s.itemPressed]}
      onPress={handlePress}
    >
      <View style={s.itemIcon}>
        <Octicons name={iconName} size={16} color={iconColor} />
      </View>

      <View style={s.itemBody}>
        <View style={s.titleRow}>
          <Text style={s.itemTitle} numberOfLines={2}>
            {pr.title}
          </Text>
          {pr.draft && (
            <View style={s.draftBadge}>
              <Text style={s.draftText}>Draft</Text>
            </View>
          )}
        </View>

        <View style={s.branchRow}>
          <Octicons name="git-branch" size={10} color={colors.textMuted} />
          <Text style={s.branchText} numberOfLines={1}>
            {pr.base.ref}
            <Text style={s.branchArrow}> ← </Text>
            {pr.head.ref}
          </Text>
        </View>

        {pr.labels.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.labelsScroll}
            contentContainerStyle={s.labelsContent}
          >
            {pr.labels.slice(0, 4).map((label) => (
              <LabelPill key={label.id} label={label} colors={colors} />
            ))}
          </ScrollView>
        )}

        <View style={s.itemMeta}>
          {pr.user.avatar_url ? (
            <Image
              source={{ uri: pr.user.avatar_url }}
              style={s.authorAvatar}
              contentFit="cover"
              transition={100}
            />
          ) : null}
          <Text style={s.itemMetaText} numberOfLines={1}>
            #{pr.number} · {pr.user.login} · {relativeTime(pr.created_at)}
          </Text>
        </View>
      </View>

      {totalComments > 0 && (
        <View style={s.commentsRow}>
          <Octicons name="comment" size={12} color={colors.textMuted} />
          <Text style={s.commentsText}>{totalComments}</Text>
        </View>
      )}
    </Pressable>
  );
});

function LabelPill({
  label,
  colors,
}: {
  label: GitHubLabel;
  colors: typeof LightColors | typeof DarkColors;
}) {
  const bg = `#${label.color}28`;
  const text = `#${label.color}`;

  return (
    <View
      style={{
        backgroundColor: bg,
        borderColor: `#${label.color}50`,
        borderRadius: Radius.full,
        borderWidth: 1,
        paddingHorizontal: Spacing.xs + 2,
        paddingVertical: 2,
      }}
    >
      <Text
        style={{ fontFamily: FontFamily.medium, fontSize: 10, color: text }}
      >
        {label.name}
      </Text>
    </View>
  );
}

function FilterTab({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: typeof LightColors | typeof DarkColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        paddingVertical: Spacing.sm,
        borderBottomWidth: active ? 2 : 0,
        borderBottomColor: colors.accent,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: FontFamily.medium,
          fontSize: FontSize.label,
          color: active ? colors.accent : colors.textMuted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function buildStyles(colors: typeof LightColors | typeof DarkColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingHorizontal: Layout.screenPadding,
      paddingBottom: Spacing.xxl,
    },
    filterRow: {
      flexDirection: "row",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      marginBottom: Spacing.sm,
      marginTop: Spacing.xs,
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
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.xs,
    },
    itemTitle: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textPrimary,
      lineHeight: FontSize.label * 1.5,
      flex: 1,
    },
    draftBadge: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.xs + 2,
      paddingVertical: 2,
      marginTop: 1,
    },
    draftText: {
      fontFamily: FontFamily.medium,
      fontSize: 10,
      color: colors.textMuted,
    },
    branchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    branchText: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
      flex: 1,
    },
    branchArrow: {
      color: colors.textMuted,
    },
    labelsScroll: {
      marginTop: 2,
    },
    labelsContent: {
      gap: Spacing.xs,
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
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
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
