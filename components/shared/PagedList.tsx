import { FlashList, type FlashListProps } from "@shopify/flash-list";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ListItemSeparator } from "@/components/shared/ListItemSeparator";

import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Layout,
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

/** Infinite list shell: loading, empty and error states, pull to refresh, next page on scroll. */
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
  ) : (
    <View style={s.centered}>
      <Text style={s.emptyTitle}>{isError ? errorText : emptyText}</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
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
    footerLoader: {
      paddingVertical: Spacing.lg,
      alignItems: "center",
    },
  });
}
