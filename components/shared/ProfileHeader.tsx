import { FontAwesome6, Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { ComponentProps, ReactNode } from "react";
import { useMemo } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { StatBlock } from "@/components/shared/StatBlock";
import {
  AvatarSize,
  FontFamily,
  FontSize,
  IconSize,
  Radius,
  Shadows,
  Spacing,
  useTheme,
  type ColorTokens,
} from "@/constants/theme";
import type { GitHubUser } from "@/types/github.types";

export type ProfileLinkIcon =
  | { set: "octicons"; name: ComponentProps<typeof Octicons>["name"] }
  | { set: "fontawesome6"; name: ComponentProps<typeof FontAwesome6>["name"] };

export interface ProfileLink {
  icon: ProfileLinkIcon;
  text: string;
  /** Opens in the browser when set; plain text otherwise. */
  url?: string;
}

interface ProfileHeaderProps {
  user: GitHubUser | undefined;
  isLoading: boolean;
  repoCount: number;
  links: ProfileLink[];
  onReposPress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
  /** Shown in place of the bio when the user has none. */
  emptyBio?: ReactNode;
}

/** Avatar, name, bio, counts and links, shared by your Profile and other users' profiles. */
export function ProfileHeader({
  user,
  isLoading,
  repoCount,
  links,
  onReposPress,
  onFollowersPress,
  onFollowingPress,
  emptyBio,
}: ProfileHeaderProps) {
  const { colors, isDark } = useTheme();
  const shadows = useMemo(() => (isDark ? {} : Shadows.light.sm), [isDark]);
  const s = useMemo(() => buildStyles(colors, shadows), [colors, shadows]);

  return (
    <>
      <View style={s.hero}>
        {isLoading ? (
          <View style={[s.avatar, s.skeleton]} />
        ) : user?.avatar_url ? (
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
          <View style={s.nameBlock}>
            <View style={[s.skeleton, { width: 160, height: 26 }]} />
            <View style={[s.skeleton, { width: 100, height: 16 }]} />
          </View>
        ) : (
          <View style={s.nameBlock}>
            {user?.name && <Text style={s.displayName}>{user.name}</Text>}
            <Text style={s.username}>@{user?.login}</Text>
            {user?.type === "Organization" && (
              <View style={[s.badge, { backgroundColor: colors.accentSubtle }]}>
                <Octicons name="organization" size={12} color={colors.accent} />
                <Text style={[s.badgeText, { color: colors.accent }]}>
                  Organization
                </Text>
              </View>
            )}
            {user?.hireable && (
              <View
                style={[s.badge, { backgroundColor: colors.successSubtle }]}
              >
                <View style={s.hireableDot} />
                <Text style={[s.badgeText, { color: colors.success }]}>
                  Open to work
                </Text>
              </View>
            )}
          </View>
        )}

        {user?.bio ? <Text style={s.bio}>{user.bio}</Text> : user && emptyBio}
      </View>

      <View style={[s.card, s.statsCard, shadows]}>
        <StatBlock
          value={repoCount}
          label="Repositories"
          isLoading={isLoading}
          onPress={onReposPress}
        />
        <View style={s.statDivider} />
        <StatBlock
          value={user?.followers ?? 0}
          label="Followers"
          isLoading={isLoading}
          onPress={onFollowersPress}
        />
        <View style={s.statDivider} />
        <StatBlock
          value={user?.following ?? 0}
          label="Following"
          isLoading={isLoading}
          onPress={onFollowingPress}
        />
      </View>

      {!isLoading && links.length > 0 && (
        <View style={[s.card, s.linksCard, shadows]}>
          {links.map((link) => (
            <LinkRow key={link.text} link={link} colors={colors} />
          ))}
        </View>
      )}
    </>
  );
}

function LinkRow({ link, colors }: { link: ProfileLink; colors: ColorTokens }) {
  const iconColor = colors.textMuted;
  const content = (
    <View style={linkStyles.row}>
      {link.icon.set === "fontawesome6" ? (
        <FontAwesome6 name={link.icon.name} size={15} color={iconColor} />
      ) : (
        <Octicons name={link.icon.name} size={15} color={iconColor} />
      )}
      <Text
        style={[
          linkStyles.text,
          { color: link.url ? colors.accent : colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {link.text}
      </Text>
      {link.url && (
        <Octicons name="link-external" size={12} color={colors.textMuted} />
      )}
    </View>
  );

  const { url } = link;
  if (!url) return content;

  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      {content}
    </Pressable>
  );
}

const linkStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  text: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
  },
});

function buildStyles(colors: ColorTokens, shadows: object) {
  return StyleSheet.create({
    hero: {
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

    skeleton: {
      borderRadius: 4,
      backgroundColor: colors.surfaceSecondary,
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

    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: Radius.full,
      marginTop: 4,
    },

    badgeText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
    },

    hireableDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.success,
    },

    bio: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: FontSize.body * 1.5,
      paddingHorizontal: Spacing.md,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },

    statsCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.md,
    },

    statDivider: {
      width: 1,
      height: 36,
      backgroundColor: colors.border,
    },

    linksCard: {
      padding: Spacing.lg,
      gap: Spacing.md,
      ...shadows,
    },
  });
}
