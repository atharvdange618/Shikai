import { Octicons } from "@expo/vector-icons";
import { FlashList, type FlashListProps } from "@shopify/flash-list";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { ListItemSeparator } from "@/components/shared/ListItemSeparator";
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

interface PagedListProps<T> extends Pick<
  FlashListProps<T>,
  "renderItem" | "keyExtractor" | "getItemType" | "drawDistance"
> {
  data: T[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
  refetch: () => Promise<unknown>;
  emptyText: string;
  errorText: string;
}

export function PagedList<T>({
  data,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  emptyText,
  errorText,
  ...listProps
}: PagedListProps<T>) {
  const { colors } = useTheme();
  const s = useMemo(() => buildStyles(colors), [colors]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const ListEmpty = isLoading ? (
    <View style={s.centered}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  ) : isError ? (
    <View style={s.centered}>
      <Octicons name="alert" size={24} color={colors.danger} />
      <Text style={s.emptyTitle}>{errorText}</Text>
      <Pressable style={s.retryButton} accessibilityRole="button" onPress={() => void refetch()}>
        <Text style={s.retryText}>Try again</Text>
      </Pressable>
    </View>
  ) : (
    <View style={s.centered}>
      <Text style={s.emptyTitle}>{emptyText}</Text>
    </View>
  );

  return (
    <View style={s.container}>
      <FlashList
        {...listProps}
        data={data}
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
        refreshControl={<PullToRefresh refreshing={refreshing} onRefresh={onRefresh} />}
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
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xxl,
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
      minHeight: 48,
      justifyContent: "center",
    },
    retryText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textOnAccent,
    },
    footerLoader: {
      paddingVertical: Spacing.lg,
      alignItems: "center",
    },
  });
}
