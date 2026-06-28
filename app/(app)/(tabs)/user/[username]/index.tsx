import { FontAwesome6, Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { useUserProfile } from "@/hooks/useUserProfile";

import {
  AvatarSize,
  DarkColors,
  FontFamily,
  FontSize,
  IconSize,
  Layout,
  LightColors,
  Radius,
  Shadows,
  Spacing,
} from "@/constants/theme";

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const shadows = useMemo(() => (isDark ? {} : Shadows.light.sm), [isDark]);

  const { data: user, isLoading, isError } = useUserProfile(username ?? "");

  const s = useMemo(() => buildStyles(colors, shadows), [colors, shadows]);

  if (isLoading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isError || !user) {
    return (
      <View style={s.loadingContainer}>
        <Text style={s.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.heroSection}>
        {user.avatar_url ? (
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

        <View style={s.nameBlock}>
          {user.name && <Text style={s.displayName}>{user.name}</Text>}
          <Text style={s.username}>@{user.login}</Text>
          {user.type === "Organization" && (
            <View style={s.orgBadge}>
              <Octicons name="organization" size={12} color={colors.accent} />
              <Text style={s.orgText}>Organization</Text>
            </View>
          )}
          {user.hireable && (
            <View style={s.hireableBadge}>
              <View style={s.hireableDot} />
              <Text style={s.hireableText}>Open to work</Text>
            </View>
          )}
        </View>

        {user.bio && <Text style={s.bio}>{user.bio}</Text>}
      </View>

      <View style={[s.statsCard, shadows]}>
        <StatBlock
          value={user.public_repos}
          label="Repositories"
          colors={colors}
        />
        <View style={s.statDivider} />
        <StatBlock
          value={user.followers}
          label="Followers"
          colors={colors}
        />
        <View style={s.statDivider} />
        <StatBlock
          value={user.following}
          label="Following"
          colors={colors}
        />
      </View>

      {(user.location || user.company || user.blog || user.twitter_username) && (
        <View style={s.metaCard}>
          {user.location && (
            <MetaRow icon="location" text={user.location} colors={colors} />
          )}
          {user.company && (
            <MetaRow
              icon="organization"
              text={user.company.replace(/^@/, "")}
              colors={colors}
            />
          )}
          {user.twitter_username && (
            <MetaRow
              iconType="fontawesome6"
              icon="x-twitter"
              text={`@${user.twitter_username}`}
              colors={colors}
              isLink
              onPress={() =>
                Linking.openURL(`https://twitter.com/${user.twitter_username}`)
              }
            />
          )}
          {user.blog && (
            <MetaRow
              icon="globe"
              text={user.blog.replace(/^https?:\/\//, "")}
              colors={colors}
              isLink
              onPress={() => {
                const url = user.blog!;
                const finalUrl = url.startsWith("http")
                  ? url
                  : `https://${url}`;
                Linking.openURL(finalUrl);
              }}
            />
          )}
          {user.email && (
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

      {user.html_url && (
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

      {user.created_at && (
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
}: {
  value: number;
  label: string;
  colors: typeof LightColors | typeof DarkColors;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: Spacing.xs }}>
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
  colors: typeof LightColors | typeof DarkColors;
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
  colors: typeof LightColors | typeof DarkColors,
  shadows: object,
) {
  return StyleSheet.create({
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },

    errorText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textSecondary,
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

    orgBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: Radius.full,
      backgroundColor: colors.accentSubtle,
      marginTop: 4,
    },

    orgText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.accent,
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

    memberSince: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      textAlign: "center",
    },
  });
}
