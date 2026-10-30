import { Octicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  ProfileHeader,
  type ProfileLink,
} from "@/components/shared/ProfileHeader";
import { RecentRepos } from "@/components/shared/RecentRepos";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserProfileRepos } from "@/hooks/useUserProfileRepos";

import {
  FontFamily,
  FontSize,
  IconSize,
  Layout,
  Radius,
  Shadows,
  Spacing,
  useTheme,
  type ColorTokens,
} from "@/constants/theme";
import type { GitHubUser } from "@/types/github.types";

function buildLinks(user: GitHubUser | undefined): ProfileLink[] {
  if (!user) return [];
  const links: ProfileLink[] = [];
  if (user.location) {
    links.push({ icon: { set: "octicons", name: "location" }, text: user.location });
  }
  if (user.company) {
    links.push({
      icon: { set: "octicons", name: "organization" },
      text: user.company.replace(/^@/, ""),
    });
  }
  if (user.twitter_username) {
    links.push({
      icon: { set: "fontawesome6", name: "x-twitter" },
      text: `@${user.twitter_username}`,
      url: `https://twitter.com/${user.twitter_username}`,
    });
  }
  if (user.blog) {
    links.push({
      icon: { set: "octicons", name: "globe" },
      text: user.blog.replace(/^https?:\/\//, ""),
      url: user.blog.startsWith("http") ? user.blog : `https://${user.blog}`,
    });
  }
  if (user.email) {
    links.push({
      icon: { set: "octicons", name: "mail" },
      text: user.email,
      url: `mailto:${user.email}`,
    });
  }
  return links;
}

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { colors, isDark } = useTheme();
  const shadows = useMemo(() => (isDark ? {} : Shadows.light.sm), [isDark]);
  const navigation = useNavigation();
  const router = useRouter();

  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useUserProfile(username ?? "");

  const { data: recentRepos, isLoading: reposLoading } = useUserProfileRepos(
    username ?? "",
  );

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.name) {
      navigation.setOptions({ title: user.name });
    } else if (user?.login) {
      navigation.setOptions({ title: user.login });
    } else if (username) {
      navigation.setOptions({ title: username });
    }
  }, [user?.name, user?.login, username, navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch()]);
    setRefreshing(false);
  }, [refetch]);

  const openUserList = useCallback(
    (list: "repos" | "followers" | "following") => {
      router.push({
        pathname: `/(app)/user/[username]/${list}`,
        params: { username: username ?? "" },
      });
    },
    [router, username],
  );

  const s = useMemo(() => buildStyles(colors, shadows), [colors, shadows]);

  if (isError && !user) {
    return (
      <View style={s.loadingContainer}>
        <Octicons name="alert" size={32} color={colors.textMuted} />
        <Text style={s.errorText}>User not found</Text>
        <Pressable
          style={({ pressed }) => [
            s.retryButton,
            pressed && s.retryButtonPressed,
          ]}
          onPress={() => refetch()}
        >
          <Text style={s.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      <ProfileHeader
        user={user}
        isLoading={isLoading}
        repoCount={user?.public_repos ?? 0}
        links={buildLinks(user)}
        onReposPress={() => openUserList("repos")}
        onFollowersPress={() => openUserList("followers")}
        onFollowingPress={() => openUserList("following")}
      />

      <RecentRepos
        repos={recentRepos?.repos}
        isLoading={reposLoading}
        onSeeAll={() => openUserList("repos")}
      />

      {!isLoading && user && (
        <View style={s.card}>
          <Pressable
            style={({ pressed }) => [s.row, pressed && s.pressed]}
            onPress={() =>
              router.push({
                pathname: "/(app)/user/[username]/gists",
                params: { username: user.login },
              })
            }
          >
            <Octicons
              name="code"
              size={IconSize.md}
              color={colors.textSecondary}
            />
            <Text style={s.rowLabel}>Gists</Text>
            <Octicons name="chevron-right" size={13} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.row, s.rowDivider, pressed && s.pressed]}
            onPress={() => Linking.openURL(user.html_url)}
          >
            <Octicons
              name="mark-github"
              size={IconSize.md}
              color={colors.textSecondary}
            />
            <Text style={s.rowLabel}>View on GitHub</Text>
            <Octicons name="link-external" size={13} color={colors.textMuted} />
          </Pressable>
        </View>
      )}

      {!isLoading && user?.created_at && (
        <Text style={s.memberSince}>
          Member since{" "}
          {new Date(user.created_at).toLocaleDateString("default", {
            month: "long",
            year: "numeric",
          })}
        </Text>
      )}
    </ScrollView>
  );
}

function buildStyles(colors: ColorTokens, shadows: object) {
  return StyleSheet.create({
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
      gap: Spacing.md,
    },

    errorText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textSecondary,
    },

    retryButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
      backgroundColor: colors.accentSubtle,
    },

    retryButtonPressed: {
      opacity: 0.7,
    },

    retryText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.accent,
    },

    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingHorizontal: Layout.screenPadding,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xxl,
      gap: Spacing.lg,
      maxWidth: 680,
      width: "100%",
      alignSelf: "center",
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      ...shadows,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      padding: Spacing.md,
    },

    rowDivider: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    pressed: {
      opacity: 0.7,
    },

    rowLabel: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textPrimary,
    },

    memberSince: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      textAlign: "center",
    },
  });
}
