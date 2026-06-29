import { FontAwesome6, Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserProfileRepos } from "@/hooks/useUserProfileRepos";
import { prefetchRepoDetails } from "@/lib/prefetch";

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
import { formatCount } from "@/lib/utils";
import type { GitHubRepo } from "@/types/github.types";

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const shadows = useMemo(() => (isDark ? {} : Shadows.light.sm), [isDark]);
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useUserProfile(username ?? "");

  const { data: topRepos, isLoading: reposLoading } = useUserProfileRepos(
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

  const handleRepoPress = useCallback(
    (repo: GitHubRepo) => {
      const repoId = `${repo.owner.login}__${repo.name}`;
      router.navigate(`/(app)/(tabs)/repos/${repoId}` as any);
    },
    [router],
  );

  const handleRepoPressIn = useCallback(
    (repo: GitHubRepo) => {
      prefetchRepoDetails(queryClient, repo.owner.login, repo.name);
    },
    [queryClient],
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
      <View style={s.heroSection}>
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
          <View style={s.nameSkeleton}>
            <View style={[s.skeleton, { width: 160, height: 26 }]} />
            <View style={[s.skeleton, { width: 100, height: 16 }]} />
          </View>
        ) : (
          <View style={s.nameBlock}>
            {user?.name && <Text style={s.displayName}>{user.name}</Text>}
            <Text style={s.username}>@{user?.login}</Text>
            {user?.type === "Organization" && (
              <View style={s.orgBadge}>
                <Octicons name="organization" size={12} color={colors.accent} />
                <Text style={s.orgText}>Organization</Text>
              </View>
            )}
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
          value={user?.public_repos ?? 0}
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

      {!isLoading &&
        (user?.location ||
          user?.company ||
          user?.blog ||
          user?.twitter_username) && (
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
            {user?.twitter_username && (
              <MetaRow
                iconType="fontawesome6"
                icon="x-twitter"
                text={`@${user.twitter_username}`}
                colors={colors}
                isLink
                onPress={() =>
                  Linking.openURL(
                    `https://twitter.com/${user.twitter_username}`,
                  )
                }
              />
            )}
            {user?.blog && (
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

      {reposLoading ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Top Repositories</Text>
          <View style={s.reposSkeleton}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[s.skeleton, s.repoSkeleton]} />
            ))}
          </View>
        </View>
      ) : topRepos?.repos && topRepos.repos.length > 0 ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Top Repositories</Text>
          {topRepos.repos.slice(0, 5).map((repo) => (
            <RepoRow
              key={repo.id}
              repo={repo}
              colors={colors}
              onPress={handleRepoPress}
              onPressIn={handleRepoPressIn}
            />
          ))}
        </View>
      ) : null}

      {!isLoading && user?.html_url && (
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

function RepoRow({
  repo,
  colors,
  onPress,
  onPressIn,
}: {
  repo: GitHubRepo;
  colors: typeof LightColors | typeof DarkColors;
  onPress: (repo: GitHubRepo) => void;
  onPressIn: (repo: GitHubRepo) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.repoRow,
        { borderColor: colors.border, backgroundColor: colors.surface },
        pressed && { opacity: 0.7 },
      ]}
      onPress={() => onPress(repo)}
      onPressIn={() => onPressIn(repo)}
    >
      <View style={styles.repoInfo}>
        <Text
          style={[styles.repoName, { color: colors.accent }]}
          numberOfLines={1}
        >
          {repo.name}
        </Text>
        {repo.description && (
          <Text
            style={[styles.repoDesc, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {repo.description}
          </Text>
        )}
      </View>
      <View style={styles.repoStats}>
        {repo.stargazers_count > 0 && (
          <View style={styles.repoStat}>
            <Octicons name="star" size={11} color={colors.star} />
            <Text style={[styles.repoStatText, { color: colors.textMuted }]}>
              {formatCount(repo.stargazers_count)}
            </Text>
          </View>
        )}
        {repo.forks_count > 0 && (
          <View style={styles.repoStat}>
            <Octicons name="repo-forked" size={11} color={colors.textMuted} />
            <Text style={[styles.repoStatText, { color: colors.textMuted }]}>
              {formatCount(repo.forks_count)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
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
  colors: typeof LightColors | typeof DarkColors;
  isLoading: boolean;
}) {
  return (
    <View style={statStyles.container}>
      {isLoading ? (
        <>
          <View style={[statStyles.skeleton, { width: 48, height: 22 }]} />
          <View style={[statStyles.skeleton, { width: 64, height: 13 }]} />
        </>
      ) : (
        <>
          <Text style={[statStyles.value, { color: colors.textPrimary }]}>
            {value.toLocaleString()}
          </Text>
          <Text style={[statStyles.label, { color: colors.textMuted }]}>
            {label}
          </Text>
        </>
      )}
    </View>
  );
}

const statStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  value: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.title,
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },
  skeleton: {
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
});

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
    <View style={metaStyles.row}>
      <IconComponent name={icon as any} size={15} color={colors.textMuted} />
      <Text
        style={[
          metaStyles.text,
          { color: isLink ? colors.accent : colors.textSecondary },
        ]}
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

const metaStyles = StyleSheet.create({
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

const styles = StyleSheet.create({
  section: {
    gap: Spacing.sm,
  },

  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.title,
    color: "inherit",
    marginBottom: Spacing.xs,
  },

  reposSkeleton: {
    gap: Spacing.sm,
  },

  repoSkeleton: {
    height: 60,
    borderRadius: Radius.lg,
  },

  repoRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },

  repoInfo: {
    flex: 1,
    gap: 2,
  },

  repoName: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
  },

  repoDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },

  repoStats: {
    flexDirection: "row",
    gap: Spacing.md,
  },

  repoStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  repoStatText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },
});

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
    },

    section: {
      gap: Spacing.sm,
    },

    sectionTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      color: colors.textPrimary,
      marginBottom: Spacing.xs,
    },

    reposSkeleton: {
      gap: Spacing.sm,
    },

    repoSkeleton: {
      height: 60,
      borderRadius: Radius.lg,
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

    skeleton: {
      borderRadius: 4,
      backgroundColor: colors.surfaceSecondary,
    },
  });
}
