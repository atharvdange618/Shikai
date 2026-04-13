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

import { useIssues } from "@/hooks/useIssues";
import { queryKeys } from "@/lib/query-client";
import type { GitHubIssue, GitHubLabel } from "@/types/github.types";

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

type IssueState = "open" | "closed";

export default function IssuesScreen() {
  const { repoId } = useLocalSearchParams<{ repoId: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;

  const [owner, repoName] = (repoId ?? "").split("__");
  const [state, setState] = useState<IssueState>("open");
  const [refreshing, setRefreshing] = useState(false);

  const {
    issues,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useIssues(owner, repoName, state);

  useEffect(() => {
    navigation.setOptions({
      title: "Issues",
      headerRight: () => (
        <Pressable
          hitSlop={12}
          style={{ marginRight: Spacing.sm, padding: Spacing.xs }}
          onPress={() =>
            WebBrowser.openBrowserAsync(
              `https://github.com/${owner}/${repoName}/issues`,
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
      queryKey: queryKeys.repoIssues(owner, repoName, state),
    });
    setRefreshing(false);
  }, [queryClient, owner, repoName, state]);

  const handleStateChange = useCallback((newState: IssueState) => {
    setState(newState);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: GitHubIssue }) => (
      <IssueItem issue={item} colors={colors} />
    ),
    [colors],
  );

  const keyExtractor = useCallback((item: GitHubIssue) => String(item.id), []);

  const s = buildStyles(colors);

  const ListHeader = (
    <View style={s.filterRow}>
      <StateTab
        label="Open"
        active={state === "open"}
        onPress={() => handleStateChange("open")}
        colors={colors}
      />
      <StateTab
        label="Closed"
        active={state === "closed"}
        onPress={() => handleStateChange("closed")}
        colors={colors}
      />
    </View>
  );

  const ListEmpty = isLoading ? (
    <View style={s.centered}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  ) : isError ? (
    <View style={s.centered}>
      <Octicons name="alert" size={24} color={colors.danger} />
      <Text style={s.emptyTitle}>Failed to load issues</Text>
      <Pressable style={s.retryButton} onPress={() => refetch()}>
        <Text style={s.retryText}>Try again</Text>
      </Pressable>
    </View>
  ) : (
    <View style={s.centered}>
      <Octicons
        name={state === "open" ? "issue-opened" : "issue-closed"}
        size={32}
        color={colors.textMuted}
      />
      <Text style={s.emptyTitle}>No {state} issues</Text>
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
        data={issues}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.listContent}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        ListHeaderComponent={ListHeader}
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

const IssueItem = memo(function IssueItem({
  issue,
  colors,
}: {
  issue: GitHubIssue;
  colors: typeof LightColors | typeof DarkColors;
}) {
  const handlePress = useCallback(() => {
    Linking.openURL(issue.html_url);
  }, [issue.html_url]);

  const isOpen = issue.state === "open";
  const iconColor = isOpen ? colors.success : colors.textMuted;
  const s = buildStyles(colors);

  return (
    <Pressable
      style={({ pressed }) => [s.item, pressed && s.itemPressed]}
      onPress={handlePress}
    >
      <View style={s.itemIcon}>
        <Octicons
          name={isOpen ? "issue-opened" : "issue-closed"}
          size={16}
          color={iconColor}
        />
      </View>

      <View style={s.itemBody}>
        <Text style={s.itemTitle} numberOfLines={2}>
          {issue.title}
        </Text>

        {issue.labels.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.labelsScroll}
            contentContainerStyle={s.labelsContent}
          >
            {issue.labels.slice(0, 4).map((label) => (
              <LabelPill key={label.id} label={label} />
            ))}
          </ScrollView>
        )}

        <View style={s.itemMeta}>
          {issue.user.avatar_url ? (
            <Image
              source={{ uri: issue.user.avatar_url }}
              style={s.authorAvatar}
              contentFit="cover"
              transition={100}
            />
          ) : null}
          <Text style={s.itemMetaText} numberOfLines={1}>
            #{issue.number} · {issue.user.login} ·{" "}
            {relativeTime(issue.created_at)}
          </Text>
        </View>
      </View>

      {issue.comments > 0 && (
        <View style={s.commentsRow}>
          <Octicons name="comment" size={12} color={colors.textMuted} />
          <Text style={s.commentsText}>{issue.comments}</Text>
        </View>
      )}
    </Pressable>
  );
});

function LabelPill({ label }: { label: GitHubLabel }) {
  const bg = `#${label.color}28`;
  const text = `#${label.color}`;

  return (
    <View
      style={[
        { backgroundColor: bg, borderColor: `#${label.color}50` },
        {
          borderRadius: Radius.full,
          borderWidth: 1,
          paddingHorizontal: Spacing.xs + 2,
          paddingVertical: 2,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: FontFamily.medium,
          fontSize: 10,
          color: text,
        }}
      >
        {label.name}
      </Text>
    </View>
  );
}

function StateTab({
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
    itemTitle: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textPrimary,
      lineHeight: FontSize.label * 1.5,
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
