import { FontAwesome6, Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  DarkColors,
  FontFamily,
  FontSize,
  IconSize,
  LightColors,
  Radius,
  Shadows,
  Spacing,
} from "@/constants/theme";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { useUser } from "@/hooks/useUser";

export default function ProfileScreen() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const shadows = isDark ? {} : Shadows.light.sm;

  const { data: user, isLoading: userLoading } = useUser();
  const { data: socialAccounts } = useSocialAccounts();

  // Extract LinkedIn URL from social accounts
  const linkedInUrl = socialAccounts?.find((account) =>
    account.url.includes("linkedin.com"),
  )?.url;

  const s = buildStyles(colors, shadows);

  return (
    <SafeAreaView style={s.safeArea} edges={["top"]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.profileSection}>
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

          <View style={s.nameBlock}>
            {userLoading ? (
              <>
                <View style={[s.skeletonLine, { width: 140, height: 22 }]} />
                <View style={[s.skeletonLine, { width: 100, height: 15 }]} />
              </>
            ) : (
              <>
                {user?.name && <Text style={s.displayName}>{user.name}</Text>}
                <Text style={s.username}>@{user?.login}</Text>
                {user?.hireable && (
                  <View style={s.hireableBadge}>
                    <View style={s.hireableDot} />
                    <Text style={s.hireableText}>Open to work</Text>
                  </View>
                )}
              </>
            )}
          </View>

          {user?.bio && <Text style={s.bio}>{user.bio}</Text>}

          {(user?.company ||
            user?.location ||
            user?.email ||
            user?.blog ||
            user?.twitter_username ||
            linkedInUrl) && (
            <View style={s.metaColumn}>
              {user?.company && (
                <View style={s.metaItem}>
                  <Octicons
                    name="organization"
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={s.metaText}>{user.company}</Text>
                </View>
              )}
              {user?.location && (
                <View style={s.metaItem}>
                  <Octicons
                    name="location"
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={s.metaText}>{user.location}</Text>
                </View>
              )}
              {user?.email && (
                <Pressable
                  style={s.metaItem}
                  onPress={() => Linking.openURL(`mailto:${user.email}`)}
                >
                  <Octicons name="mail" size={14} color={colors.accent} />
                  <Text style={[s.metaText, { color: colors.accent }]}>
                    {user.email}
                  </Text>
                </Pressable>
              )}
              {linkedInUrl && (
                <Pressable
                  style={s.metaItem}
                  onPress={() => Linking.openURL(linkedInUrl)}
                >
                  <FontAwesome6
                    name="linkedin"
                    size={14}
                    color={colors.accent}
                  />
                  <Text style={[s.metaText, { color: colors.accent }]}>
                    LinkedIn
                  </Text>
                </Pressable>
              )}
              {user?.blog && (
                <Pressable
                  style={s.metaItem}
                  onPress={() => {
                    const url = user.blog!.startsWith("http")
                      ? user.blog!
                      : `https://${user.blog}`;
                    Linking.openURL(url);
                  }}
                >
                  <Octicons name="globe" size={14} color={colors.accent} />
                  <Text
                    style={[s.metaText, { color: colors.accent }]}
                    numberOfLines={1}
                  >
                    {user.blog.replace(/^https?:\/\//, "")}
                  </Text>
                </Pressable>
              )}
              {user?.twitter_username && (
                <Pressable
                  style={s.metaItem}
                  onPress={() =>
                    Linking.openURL(
                      `https://twitter.com/${user.twitter_username}`,
                    )
                  }
                >
                  <FontAwesome6
                    name="x-twitter"
                    size={14}
                    color={colors.accent}
                  />
                  <Text
                    style={[s.metaText, { color: colors.accent }]}
                    numberOfLines={1}
                  >
                    @{user.twitter_username}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          <View style={s.statsRow}>
            <StatPill
              icon="people"
              value={user?.followers ?? 0}
              label="followers"
              colors={colors}
              isLoading={userLoading}
            />
            <View style={s.statDivider} />
            <StatPill
              icon="person"
              value={user?.following ?? 0}
              label="following"
              colors={colors}
              isLoading={userLoading}
            />
            <View style={s.statDivider} />
            <StatPill
              icon="repo"
              value={user?.public_repos ?? 0}
              label="repos"
              colors={colors}
              isLoading={userLoading}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface StatPillProps {
  icon: React.ComponentProps<typeof Octicons>["name"];
  value: number;
  label: string;
  colors: typeof LightColors | typeof DarkColors;
  isLoading?: boolean;
}

function StatPill({ icon, value, label, colors, isLoading }: StatPillProps) {
  const s = buildStatPillStyles(colors);

  if (isLoading) {
    return (
      <View style={s.container}>
        <View style={[s.skeletonCircle]} />
        <View style={{ gap: 4, alignItems: "center" }}>
          <View style={[s.skeletonLine, { width: 30, height: 16 }]} />
          <View style={[s.skeletonLine, { width: 50, height: 12 }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.iconWrap}>
        <Octicons name={icon} size={18} color={colors.accent} />
      </View>
      <View style={s.textBlock}>
        <Text style={s.value}>{value}</Text>
        <Text style={s.label}>{label}</Text>
      </View>
    </View>
  );
}

function buildStatPillStyles(colors: typeof LightColors | typeof DarkColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: Radius.full,
      backgroundColor: `${colors.accent}18`,
      alignItems: "center",
      justifyContent: "center",
    },
    textBlock: {
      gap: 2,
    },
    value: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
    },
    label: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
    },
    skeletonCircle: {
      width: 36,
      height: 36,
      borderRadius: Radius.full,
      backgroundColor: colors.surfaceSecondary,
    },
    skeletonLine: {
      height: 12,
      borderRadius: 4,
      backgroundColor: colors.surfaceSecondary,
    },
  });
}

function buildStyles(
  colors: typeof LightColors | typeof DarkColors,
  shadows: Record<string, unknown>,
) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: Spacing.lg,
      gap: Spacing.xl,
    },

    profileSection: {
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.lg,
    },

    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.surfaceSecondary,
      ...shadows,
    },

    avatarFallback: {
      alignItems: "center",
      justifyContent: "center",
    },

    nameBlock: {
      alignItems: "center",
      gap: 4,
    },

    displayName: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.heading,
      color: colors.textPrimary,
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
      lineHeight: 20,
      paddingHorizontal: Spacing.lg,
    },

    metaColumn: {
      width: "100%",
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },

    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },

    metaText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textSecondary,
      flex: 1,
    },

    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      gap: Spacing.md,
    },

    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
    },

    skeletonLine: {
      height: 12,
      borderRadius: 4,
      backgroundColor: colors.surfaceSecondary,
    },
  });
}
