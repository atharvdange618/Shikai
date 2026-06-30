import { FontAwesome6, Octicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
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

import { useNotifications } from "@/hooks/useNotifications";
import { useRepoCount } from "@/hooks/useRepoCount";
import { useUser } from "@/hooks/useUser";
import { queryKeys } from "@/lib/query-client";

import {
  AvatarSize,
  FontFamily,
  FontSize,
  IconSize,
  Layout,
  Radius,
  Shadows,
  Spacing,
  useTheme,
} from "@/constants/theme";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { useAuthStore } from "@/stores/auth.store";

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const shadows = useMemo(() => (isDark ? {} : Shadows.light.sm), [isDark]);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useUser();
  const { data: socialAccounts } = useSocialAccounts();
  const { data: repoCount } = useRepoCount();
  const pat = useAuthStore((s) => s.pat);
  const { notifications } = useNotifications();

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications],
  );

  const linkedInUrl = socialAccounts?.find((account) =>
    account.url.includes("linkedin.com"),
  )?.url;

  const twitterUrl = socialAccounts?.find(
    (account) =>
      account.url.includes("x.com") || account.url.includes("twitter.com"),
  )?.url;

  const blogUrl = socialAccounts?.find(
    (account) => account.provider === "generic",
  )?.url;

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.user() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.socialAccounts() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.repoCount() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

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
        <View style={s.headerSpacer} />
        <View style={s.headerIcons}>
          {pat && (
            <Pressable
              style={({ pressed }) => [
                s.headerIconButton,
                pressed && s.headerIconButtonPressed,
              ]}
              onPress={() =>
                router.push("/(app)/(tabs)/profile/notifications" as Href)
              }
            >
              <Octicons name="bell" size={20} color={colors.textSecondary} />
              {unreadCount > 0 && (
                <View style={[s.badge, { backgroundColor: colors.accent }]}>
                  <Text style={s.badgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [
              s.headerIconButton,
              pressed && s.headerIconButtonPressed,
            ]}
            onPress={() =>
              router.push("/(app)/(tabs)/profile/settings" as Href)
            }
          >
            <Octicons name="gear" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={s.heroSection}>
        {user?.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            style={s.avatar}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[s.avatar, s.avatarFallback]}>
            <Octicons
              name="person"
              size={IconSize.xxl}
              color={colors.textMuted}
            />
          </View>
        )}

        {isLoading ? (
          <View style={s.nameSkeleton}>
            <View style={[s.skeleton, { width: 160, height: 26 }]} />
            <View style={[s.skeleton, { width: 100, height: 16 }]} />
          </View>
        ) : (
          <View style={s.nameBlock}>
            {user?.name && <Text style={s.displayName}>{user.name}</Text>}
            <Text style={s.username}>@{user?.login}</Text>
            {user?.hireable && (
              <View style={s.hireableBadge}>
                <View style={s.hireableDot} />
                <Text style={s.hireableText}>Open to work</Text>
              </View>
            )}
          </View>
        )}

        {user?.bio && <Text style={s.bio}>{user.bio}</Text>}
      </View>

      <View style={[s.statsCard, shadows]}>
        <StatBlock
          value={repoCount ?? user?.public_repos ?? 0}
          label="Repositories"
          colors={colors}
          isLoading={isLoading}
        />
        <View style={s.statDivider} />
        <StatBlock
          value={user?.followers ?? 0}
          label="Followers"
          colors={colors}
          isLoading={isLoading}
        />
        <View style={s.statDivider} />
        <StatBlock
          value={user?.following ?? 0}
          label="Following"
          colors={colors}
          isLoading={isLoading}
        />
      </View>

      {(user?.location ||
        user?.company ||
        user?.blog ||
        blogUrl ||
        user?.twitter_username ||
        twitterUrl ||
        linkedInUrl) && (
        <View style={s.metaCard}>
          {user?.location && (
            <MetaRow icon="location" text={user.location} colors={colors} />
          )}
          {user?.company && (
            <MetaRow
              icon="organization"
              text={user.company.replace(/^@/, "")}
              colors={colors}
            />
          )}
          {linkedInUrl && (
            <MetaRow
              iconType="fontawesome6"
              icon="linkedin"
              text={
                linkedInUrl.split("/in/").pop()?.split("/")[0] || "LinkedIn"
              }
              colors={colors}
              isLink
              onPress={() => Linking.openURL(linkedInUrl)}
            />
          )}
          {(twitterUrl || user?.twitter_username) && (
            <MetaRow
              iconType="fontawesome6"
              icon="x-twitter"
              text={
                twitterUrl
                  ? `@${twitterUrl.split("/").pop()}`
                  : `@${user?.twitter_username}`
              }
              colors={colors}
              isLink
              onPress={() =>
                Linking.openURL(
                  twitterUrl || `https://twitter.com/${user?.twitter_username}`,
                )
              }
            />
          )}
          {(blogUrl || user?.blog) && (
            <MetaRow
              icon="globe"
              text={(blogUrl || user?.blog)!.replace(/^https?:\/\//, "")}
              colors={colors}
              isLink
              onPress={() => {
                const url = blogUrl || user?.blog!;
                const finalUrl = url.startsWith("http")
                  ? url
                  : `https://${url}`;
                Linking.openURL(finalUrl);
              }}
            />
          )}
          {user?.email && (
            <MetaRow
              icon="mail"
              text={user.email}
              colors={colors}
              isLink
              onPress={() => Linking.openURL(`mailto:${user.email}`)}
            />
          )}
        </View>
      )}

      {user?.html_url && (
        <Pressable
          style={({ pressed }) => [
            s.githubButton,
            pressed && s.githubButtonPressed,
          ]}
          onPress={() => Linking.openURL(user.html_url)}
        >
          <Octicons
            name="mark-github"
            size={IconSize.md}
            color={colors.textSecondary}
          />
          <Text style={s.githubButtonText}>View on GitHub</Text>
          <Octicons name="link-external" size={13} color={colors.textMuted} />
        </Pressable>
      )}

      <Pressable
        style={({ pressed }) => [
          s.savedButton,
          pressed && s.savedButtonPressed,
        ]}
        onPress={() => router.push("/(app)/(tabs)/profile/saved" as Href)}
      >
        <Octicons
          name="bookmark"
          size={IconSize.md}
          color={colors.textSecondary}
        />
        <Text style={s.savedButtonText}>Saved Repos</Text>
        <Octicons name="chevron-right" size={13} color={colors.textMuted} />
      </Pressable>

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

function StatBlock({
  value,
  label,
  colors,
  isLoading,
}: {
  value: number;
  label: string;
  colors: ReturnType<typeof useTheme>["colors"];
  isLoading: boolean;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: Spacing.xs }}>
      {isLoading ? (
        <>
          <View
            style={{
              width: 48,
              height: 22,
              borderRadius: 4,
              backgroundColor: colors.surfaceSecondary,
            }}
          />
          <View
            style={{
              width: 64,
              height: 13,
              borderRadius: 4,
              backgroundColor: colors.surfaceSecondary,
            }}
          />
        </>
      ) : (
        <>
          <Text
            style={{
              fontFamily: FontFamily.bold,
              fontSize: FontSize.title,
              color: colors.textPrimary,
              fontVariant: ["tabular-nums"],
            }}
          >
            {value.toLocaleString()}
          </Text>
          <Text
            style={{
              fontFamily: FontFamily.regular,
              fontSize: FontSize.caption,
              color: colors.textMuted,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </View>
  );
}

function MetaRow({
  icon,
  text,
  colors,
  isLink = false,
  onPress,
  iconType = "octicons",
}: {
  icon: React.ComponentProps<typeof Octicons>["name"] | string;
  text: string;
  colors: ReturnType<typeof useTheme>["colors"];
  isLink?: boolean;
  onPress?: () => void;
  iconType?: "octicons" | "fontawesome6";
}) {
  const IconComponent = iconType === "fontawesome6" ? FontAwesome6 : Octicons;

  const content = (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}
    >
      <IconComponent name={icon as any} size={15} color={colors.textMuted} />
      <Text
        style={{
          flex: 1,
          fontFamily: FontFamily.regular,
          fontSize: FontSize.body,
          color: isLink ? colors.accent : colors.textSecondary,
        }}
        numberOfLines={1}
      >
        {text}
      </Text>
      {isLink && (
        <Octicons name="link-external" size={12} color={colors.textMuted} />
      )}
    </View>
  );

  if (isLink && onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

function buildStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  shadows: object,
) {
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

    headerSpacer: {
      flex: 1,
    },

    headerIcons: {
      flexDirection: "row",
      gap: Spacing.sm,
    },

    headerIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceSecondary,
    },

    headerIconButtonPressed: {
      opacity: 0.7,
    },

    badge: {
      position: "absolute",
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },

    badgeText: {
      fontFamily: FontFamily.bold,
      fontSize: 9,
      color: "#fff",
    },

    heroSection: {
      alignItems: "center",
      gap: Spacing.md,
    },

    avatar: {
      width: AvatarSize.xl,
      height: AvatarSize.xl,
      borderRadius: AvatarSize.xl / 2,
      borderWidth: 3,
      borderColor: colors.border,
    },

    avatarFallback: {
      backgroundColor: colors.surfaceSecondary,
      alignItems: "center",
      justifyContent: "center",
    },

    nameSkeleton: {
      alignItems: "center",
      gap: Spacing.sm,
    },

    nameBlock: {
      alignItems: "center",
      gap: Spacing.xs,
    },

    displayName: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.heading,
      color: colors.textPrimary,
      textAlign: "center",
    },

    username: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textSecondary,
    },

    hireableBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: Radius.full,
      backgroundColor: `${colors.success}18`,
      marginTop: 4,
    },

    hireableDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.success,
    },

    hireableText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.success,
    },

    bio: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: FontSize.body * 1.5,
      paddingHorizontal: Spacing.md,
    },

    statsCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.md,
    },

    statDivider: {
      width: 1,
      height: 36,
      backgroundColor: colors.border,
    },

    metaCard: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.md,
      ...shadows,
    },

    githubButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      ...shadows,
    },

    githubButtonPressed: {
      opacity: 0.7,
    },

    githubButtonText: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textSecondary,
    },

    savedButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      ...shadows,
    },

    savedButtonPressed: {
      opacity: 0.7,
    },

    savedButtonText: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textSecondary,
    },

    memberSince: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      textAlign: "center",
    },

    skeleton: {
      borderRadius: 4,
      backgroundColor: colors.surfaceSecondary,
    },
  });
}
