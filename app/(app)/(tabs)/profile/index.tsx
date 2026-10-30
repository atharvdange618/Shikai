import { Octicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Href, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
import { useRepoCount } from "@/hooks/useRepoCount";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { useUser } from "@/hooks/useUser";
import { useUserProfileRepos } from "@/hooks/useUserProfileRepos";
import { queryKeys } from "@/lib/query-client";

import {
  BorderWidth,
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

// Your own profile also reads social accounts, which carry LinkedIn and can
// override the X handle and blog on the user record.
function buildLinks(
  user: GitHubUser | undefined,
  socialUrls: string[],
  genericUrl: string | undefined,
): ProfileLink[] {
  if (!user) return [];
  const linkedInUrl = socialUrls.find((url) => url.includes("linkedin.com"));
  const twitterUrl = socialUrls.find(
    (url) => url.includes("x.com") || url.includes("twitter.com"),
  );
  const blog = genericUrl || user.blog;

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
  if (linkedInUrl) {
    links.push({
      icon: { set: "fontawesome6", name: "linkedin" },
      text: linkedInUrl.split("/in/").pop()?.split("/")[0] || "LinkedIn",
      url: linkedInUrl,
    });
  }
  if (twitterUrl || user.twitter_username) {
    links.push({
      icon: { set: "fontawesome6", name: "x-twitter" },
      text: twitterUrl
        ? `@${twitterUrl.split("/").pop()}`
        : `@${user.twitter_username}`,
      url: twitterUrl || `https://twitter.com/${user.twitter_username}`,
    });
  }
  if (blog) {
    links.push({
      icon: { set: "octicons", name: "globe" },
      text: blog.replace(/^https?:\/\//, ""),
      url: blog.startsWith("http") ? blog : `https://${blog}`,
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

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const shadows = useMemo(() => (isDark ? {} : Shadows.light.sm), [isDark]);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useUser();
  const { data: socialAccounts } = useSocialAccounts();
  const { data: repoCount } = useRepoCount();
  const { data: recentRepos, isLoading: reposLoading } = useUserProfileRepos(
    user?.login ?? "",
  );

  const links = buildLinks(
    user,
    socialAccounts?.map((account) => account.url) ?? [],
    socialAccounts?.find((account) => account.provider === "generic")?.url,
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.user() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.socialAccounts() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.repoCount() }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.userProfileRepos(user?.login ?? ""),
      }),
    ]);
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [queryClient, user?.login]);

  const openUserList = useCallback(
    (list: "followers" | "following") => {
      if (!user?.login) return;
      router.push({
        pathname: `/(app)/user/[username]/${list}`,
        params: { username: user.login },
      });
    },
    [router, user?.login],
  );

  const s = useMemo(() => buildStyles(colors, shadows), [colors, shadows]);

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
      <View style={s.headerRow}>
        <Pressable
          style={({ pressed }) => [
            s.headerIconButton,
            pressed && s.pressed,
          ]}
          onPress={() => router.push("/(app)/(tabs)/profile/settings" as Href)}
          hitSlop={8}
          accessibilityLabel="Settings"
        >
          <Octicons name="gear" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ProfileHeader
        user={user}
        isLoading={isLoading}
        repoCount={repoCount ?? user?.public_repos ?? 0}
        links={links}
        onReposPress={() => router.navigate("/(app)/(tabs)/repos")}
        onFollowersPress={() => openUserList("followers")}
        onFollowingPress={() => openUserList("following")}
        emptyBio={
          <Pressable
            style={({ pressed }) => [s.profilePrompt, pressed && s.pressed]}
            onPress={() =>
              Linking.openURL("https://github.com/settings/profile")
            }
          >
            <Octicons name="person" size={14} color={colors.accent} />
            <Text style={s.profilePromptText}>Add a bio to your profile</Text>
            <Octicons name="link-external" size={10} color={colors.textMuted} />
          </Pressable>
        }
      />

      {/* See all opens the Repos tab, which includes your private repos. */}
      <RecentRepos
        repos={recentRepos?.repos}
        isLoading={reposLoading || isLoading}
        onSeeAll={() => router.navigate("/(app)/(tabs)/repos")}
      />

      <View style={s.card}>
        <Pressable
          style={({ pressed }) => [s.row, pressed && s.pressed]}
          onPress={() => router.push("/(app)/(tabs)/profile/saved" as Href)}
        >
          <Octicons
            name="bookmark"
            size={IconSize.md}
            color={colors.textSecondary}
          />
          <Text style={s.rowLabel}>Saved Repos</Text>
          <Octicons name="chevron-right" size={13} color={colors.textMuted} />
        </Pressable>

        {user?.login && (
          <Pressable
            style={({ pressed }) => [s.row, s.rowDivider, pressed && s.pressed]}
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
        )}

        {user?.html_url && (
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
        )}
      </View>

      {user?.created_at && (
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
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingHorizontal: Layout.screenPadding,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xxl,
      gap: Spacing.lg,
    },

    headerRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: -Spacing.sm,
      marginTop: Spacing["3xl"],
    },

    headerIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceSecondary,
    },

    pressed: {
      opacity: 0.7,
    },

    profilePrompt: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
      borderWidth: BorderWidth.normal,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },

    profilePromptText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textSecondary,
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
