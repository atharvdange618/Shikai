import { Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PagedList } from "@/components/shared/PagedList";
import type { GitHubSimpleUser } from "@/types/github.types";

import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";

interface UserListProps {
  users: GitHubSimpleUser[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
  refetch: () => Promise<unknown>;
  emptyText: string;
  errorText: string;
}

const keyExtractor = (item: GitHubSimpleUser) => String(item.id);

export function UserList({
  users,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  emptyText,
  errorText,
}: UserListProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const s = useMemo(() => buildStyles(colors), [colors]);

  const renderItem = useCallback(
    ({ item }: { item: GitHubSimpleUser }) => (
      <Pressable
        style={({ pressed }) => [s.card, pressed && { opacity: 0.7 }]}
        onPress={() =>
          router.push({
            pathname: "/(app)/user/[username]",
            params: { username: item.login },
          })
        }
      >
        <Image
          source={{ uri: item.avatar_url }}
          style={s.avatar}
          contentFit="cover"
          transition={200}
        />
        <View style={s.info}>
          <Text style={s.name}>{item.login}</Text>
          {item.type && <Text style={s.type}>{item.type}</Text>}
        </View>
        <Octicons name="chevron-right" size={14} color={colors.textMuted} />
      </Pressable>
    ),
    [s, colors, router],
  );

  return (
    <PagedList
      data={users}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      isLoading={isLoading}
      isError={isError}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      refetch={refetch}
      emptyText={emptyText}
      errorText={errorText}
    />
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.md,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accentSubtle,
    },
    info: {
      flex: 1,
      gap: 2,
    },
    name: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
    },
    type: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },
  });
}
