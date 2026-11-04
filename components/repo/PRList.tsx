import {
  FontFamily,
  FontSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";
import { FlashList, type FlashListProps } from "@shopify/flash-list";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ReactNode } from "react";

export const prStyles = StyleSheet.create({
  content: {
    padding: Layout.screenPadding,
    paddingBottom: Spacing["3xl"],
    gap: Spacing.md,
  },
  row: {
    minHeight: 64,
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
  },
  title: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body },
  text: { fontFamily: FontFamily.regular, fontSize: FontSize.label },
  meta: { fontFamily: FontFamily.regular, fontSize: FontSize.caption },
  mono: { fontFamily: FontFamily.mono, fontSize: FontSize.caption },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  button: { minHeight: 48, padding: Spacing.sm, justifyContent: "center" },
});

export function PRPageState({
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  count,
  emptyText,
}: {
  isLoading: boolean;
  isError: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
  refetch: () => unknown;
  count: number;
  emptyText: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ padding: Spacing.md, gap: Spacing.sm }}>
      {(isLoading || isFetchingNextPage) && (
        <ActivityIndicator
          color={colors.accent}
          accessibilityLabel="Loading results"
        />
      )}
      {isError && (
        <Text style={[prStyles.text, { color: colors.danger }]}>
          {count
            ? "Couldn’t load all results. Loaded rows are still available."
            : "Results unavailable."}
        </Text>
      )}
      {!isLoading && !isError && !hasNextPage && count === 0 && (
        <Text style={[prStyles.text, { color: colors.textSecondary }]}>
          {emptyText}
        </Text>
      )}
      {!isLoading && !isFetchingNextPage && (isError || hasNextPage) && (
        <Pressable
          accessibilityRole="button"
          style={prStyles.button}
          onPress={() => {
            if (hasNextPage) void fetchNextPage();
            else void refetch();
          }}
        >
          <Text style={[prStyles.text, { color: colors.accent }]}>
            {isError ? "Retry" : "Load more"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function PRList<T>({
  header,
  footer,
  ...props
}: Pick<
  FlashListProps<T>,
  "data" | "renderItem" | "keyExtractor" | "getItemType"
> & { header?: ReactNode; footer?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlashList
        {...props}
        ListHeaderComponent={
          <View style={{ padding: Spacing.md, gap: Spacing.sm }}>{header}</View>
        }
        ListFooterComponent={
          <View style={{ paddingBottom: Spacing["3xl"] }}>{footer}</View>
        }
      />
    </View>
  );
}

export function PRGitHubLink({
  url,
  label = "Open on GitHub",
}: {
  url: string;
  label?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      style={prStyles.button}
      onPress={() => void Linking.openURL(url)}
    >
      <Text style={[prStyles.text, { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}
