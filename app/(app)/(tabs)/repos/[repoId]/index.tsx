import { ContributorRow } from "@/components/repo/ContributorRow";
import { LanguageBar } from "@/components/repo/LanguageBar";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import {
  BorderWidth,
  DarkColors,
  FontFamily,
  FontSize,
  IconSize,
  Layout,
  LightColors,
  Radius,
  Spacing,
} from "@/constants/theme";
import { useRepoDetailsScreen } from "@/hooks/useRepoDetails";
import { prefetchFileTree, prefetchRepoCommits } from "@/lib/prefetch";
import { formatCount, relativeTime } from "@/lib/utils";
import { Octicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ANIM_DELAYS = {
  hero: 0,
  stats: 60,
  activity: 120,
  commitSpotlight: 180,
  languages: 240,
  contributors: 300,
  actionBar: 360,
  readme: 420,
} as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

type HealthBadge = { label: string; icon: string; color: "warning" | "danger" };

function getHealthBadges(
  repo:
    | {
        license: { spdx_id: string } | null;
        topics: string[];
        pushed_at: string;
      }
    | undefined,
  readme: string | undefined,
  isLoading: boolean,
): HealthBadge[] {
  if (isLoading || !repo) return [];
  const badges: HealthBadge[] = [];

  if (!repo.license || repo.license.spdx_id === "NOASSERTION") {
    badges.push({ label: "No license", icon: "law", color: "warning" });
  }
  if (repo.topics.length === 0) {
    badges.push({ label: "No topics", icon: "tag", color: "warning" });
  }
  if (readme === undefined) {
    badges.push({
      label: "No README",
      icon: "file-directory",
      color: "warning",
    });
  }

  const daysSincePush =
    (Date.now() - new Date(repo.pushed_at).getTime()) / 86_400_000;
  if (daysSincePush > 90) {
    badges.push({
      label: "Stale",
      icon: "alert",
      color: daysSincePush > 180 ? "danger" : "warning",
    });
  }

  return badges;
}

export default function RepoDetailsScreen() {
  const { repoId } = useLocalSearchParams<{ repoId: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;

  const [owner, repoName] = (repoId ?? "").split("__");

  const [copiedHash, setCopiedHash] = useState(false);

  const {
    repo,
    languages,
    commitCount,
    lastCommit,
    issuesPRStats,
    contributors,
    readme,
    isLoading,
    isError,
    error,
    refetch,
  } = useRepoDetailsScreen(owner, repoName);

  useEffect(() => {
    if (repo?.name) {
      try {
        navigation.setOptions({
          title: repo.name,
          headerBackVisible: true,
        });
      } catch {
        /* navigator not ready yet */
      }
    }
  }, [repo?.name, navigation]);

  useEffect(() => {
    if (navigation.canGoBack()) return;
    try {
      navigation.setOptions({
        headerLeft: () => (
          <Pressable
            onPress={() => router.replace("/(app)/(tabs)/repos" as any)}
            hitSlop={8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingRight: 8,
            }}
          >
            <Octicons
              name="chevron-left"
              size={IconSize.md}
              color={colors.accent}
            />
            <Text
              style={{
                fontFamily: FontFamily.regular,
                fontSize: FontSize.body,
                color: colors.accent,
              }}
            >
              Repos
            </Text>
          </Pressable>
        ),
      });
    } catch {
      /* navigator not ready yet */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoading.core) return;
    const timer = setTimeout(() => refetch(), 10_000);
    return () => clearTimeout(timer);
  }, [isLoading.core, refetch]);

  const handleCopyHash = useCallback(async () => {
    if (!lastCommit?.sha) return;
    await Clipboard.setStringAsync(lastCommit.sha);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  }, [lastCommit?.sha]);

  const handleCommitsPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/(tabs)/repos/${repoId}/commits`);
  }, [router, repoId]);

  const handleCommitsPressIn = useCallback(() => {
    if (!owner || !repoName) return;
    prefetchRepoCommits(queryClient, owner, repoName);
  }, [queryClient, owner, repoName]);

  const handleCodePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/(tabs)/repos/${repoId}/files`);
  }, [router, repoId]);

  const handleCodePressIn = useCallback(() => {
    if (!owner || !repoName) return;
    prefetchFileTree(queryClient, owner, repoName);
  }, [queryClient, owner, repoName]);

  const handleShare = useCallback(async () => {
    if (!repo) return;
    try {
      await Share.share({
        message: `${repo.full_name} - ${repo.html_url}`,
      });
    } catch {
      /* share cancelled */
    }
  }, [repo]);

  const handleIssuesPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/(tabs)/repos/${repoId}/issues`);
  }, [router, repoId]);

  const handleIssuesPressIn = useCallback(() => {
    if (!owner || !repoName) return;
  }, [owner, repoName]);

  const handlePRsPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/(tabs)/repos/${repoId}/pull-requests`);
  }, [router, repoId]);

  const handlePRsPressIn = useCallback(() => {
    if (!owner || !repoName) return;
  }, [owner, repoName]);

  const insets = useSafeAreaInsets();
  const s = useMemo(
    () => buildStyles(colors, insets.bottom),
    [colors, insets.bottom],
  );

  if (isError) {
    return (
      <View style={s.centered}>
        <Octicons name="alert" size={IconSize.xl} color={colors.danger} />
        <Text style={s.errorTitle}>Failed to load repository</Text>
        <Text style={s.errorSubtitle}>{(error as Error)?.message}</Text>
        <Pressable style={s.retryButton} onPress={() => refetch()}>
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
    >
      <Animated.View
        entering={FadeInDown.duration(400).delay(ANIM_DELAYS.hero)}
        style={s.headerCard}
      >
        {isLoading.core ? (
          <>
            <View style={[s.skeleton, { width: 80, height: 12 }]} />
            <View style={[s.skeleton, { width: 160, height: 22 }]} />
            <View style={[s.skeleton, { width: "100%", height: 40 }]} />
          </>
        ) : (
          <>
            <Text style={s.ownerText}>{owner}</Text>
            <View style={s.titleRow}>
              <Text style={s.repoName} numberOfLines={1}>
                {repo?.name}
              </Text>
              {repo?.fork && (
                <View
                  style={[
                    s.badge,
                    {
                      backgroundColor: colors.badgeForkBg,
                      borderColor: colors.accentMuted,
                    },
                  ]}
                >
                  <Text style={[s.badgeText, { color: colors.badgeForkText }]}>
                    Fork
                  </Text>
                </View>
              )}
              {repo && (
                <View
                  style={[
                    s.badge,
                    {
                      backgroundColor: repo.private
                        ? colors.badgePrivateBg
                        : colors.badgePublicBg,
                      borderColor: repo.private
                        ? colors.border
                        : colors.successSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.badgeText,
                      {
                        color: repo.private
                          ? colors.badgePrivateText
                          : colors.badgePublicText,
                      },
                    ]}
                  >
                    {repo.private ? "Private" : "Public"}
                  </Text>
                </View>
              )}
            </View>
            {getHealthBadges(repo, readme, isLoading.core).length > 0 && (
              <View style={s.healthBadgeRow}>
                {getHealthBadges(repo, readme, isLoading.core).map((badge) => {
                  const isD = badge.color === "danger";
                  const badgeColor = isD ? colors.danger : colors.warning;
                  const badgeBg = isD
                    ? colors.dangerSubtle
                    : colors.warningSubtle;
                  return (
                    <View
                      key={badge.label}
                      style={[
                        s.healthBadge,
                        { backgroundColor: badgeBg, borderColor: badgeColor },
                      ]}
                    >
                      <View
                        style={[
                          s.healthBadgeDot,
                          { backgroundColor: badgeColor },
                        ]}
                      />
                      <Octicons
                        name={badge.icon as any}
                        size={11}
                        color={badgeColor}
                      />
                      <Text style={[s.healthBadgeText, { color: badgeColor }]}>
                        {badge.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {repo?.description && (
              <Text style={s.description} numberOfLines={3} selectable>
                {repo.description}
              </Text>
            )}

            {repo?.homepage && (
              <Pressable
                style={s.websiteRow}
                onPress={() => {
                  try {
                    Linking.openURL(repo.homepage!);
                  } catch {
                    /* suppressed */
                  }
                }}
              >
                <Octicons
                  name="link"
                  size={IconSize.xs}
                  color={colors.textLink}
                />
                <Text style={s.websiteText} numberOfLines={1}>
                  {repo.homepage.replace(/^https?:\/\//, "")}
                </Text>
              </Pressable>
            )}

            {repo?.topics && repo.topics.length > 0 && (
              <View style={s.topicsRow}>
                {repo.topics.map((topic) => (
                  <View key={topic} style={s.topicPill}>
                    <Text style={s.topicText}>{topic}</Text>
                  </View>
                ))}
              </View>
            )}

            {repo?.license?.spdx_id &&
              repo.license.spdx_id !== "NOASSERTION" && (
                <View style={s.licenseRow}>
                  <Octicons
                    name="law"
                    size={IconSize.xs}
                    color={colors.textMuted}
                  />
                  <Text style={s.licenseText}>{repo.license.spdx_id}</Text>
                </View>
              )}
          </>
        )}
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(400).delay(ANIM_DELAYS.stats)}
        style={s.statsCard}
      >
        <StatItem
          icon="star"
          value={repo?.stargazers_count ?? 0}
          label="Stars"
          colors={colors}
          isLoading={isLoading.core}
          iconColor={colors.star}
        />
        <View style={s.statDivider} />
        <StatItem
          icon="repo-forked"
          value={repo?.forks_count ?? 0}
          label="Forks"
          colors={colors}
          isLoading={isLoading.core}
        />
        <View style={s.statDivider} />
        <StatItem
          icon="eye"
          value={repo?.watchers_count ?? 0}
          label="Watching"
          colors={colors}
          isLoading={isLoading.core}
        />
        <View style={s.statDivider} />
        <StatItem
          icon="git-commit"
          value={commitCount ?? 0}
          label="Commits"
          colors={colors}
          isLoading={isLoading.core || isLoading.commitCount}
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(400).delay(ANIM_DELAYS.activity)}
        style={s.activityCard}
      >
        {isLoading.core ? (
          <>
            <View style={s.activityRow}>
              <View style={[s.skeleton, { width: 14, height: 14 }]} />
              <View style={[s.skeleton, { width: 24, height: 14 }]} />
              <View style={[s.skeleton, { width: 80, height: 12 }]} />
            </View>
            <View style={s.activityDivider} />
            <View style={s.activityRow}>
              <View style={[s.skeleton, { width: 14, height: 14 }]} />
              <View style={[s.skeleton, { width: 24, height: 14 }]} />
              <View style={[s.skeleton, { width: 120, height: 12 }]} />
            </View>
          </>
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [
                s.activityRow,
                pressed && { opacity: 0.6 },
              ]}
              onPress={handleIssuesPress}
              onPressIn={handleIssuesPressIn}
            >
              <Octicons
                name="issue-opened"
                size={14}
                color={
                  (issuesPRStats?.openIssues ?? 0) > 0
                    ? colors.success
                    : colors.textMuted
                }
              />
              <Text style={s.activityCount}>
                {issuesPRStats?.openIssues ?? 0}
              </Text>
              <Text style={s.activityLabel}>Issues</Text>
              <Octicons
                name="chevron-right"
                size={12}
                color={colors.textMuted}
                style={{ marginLeft: "auto" }}
              />
            </Pressable>

            <View style={s.activityDivider} />

            <Pressable
              style={({ pressed }) => [
                s.activityRow,
                pressed && { opacity: 0.6 },
              ]}
              onPress={handlePRsPress}
              onPressIn={handlePRsPressIn}
            >
              <Octicons
                name="git-pull-request"
                size={14}
                color={
                  (issuesPRStats?.openPullRequests ?? 0) > 0
                    ? colors.accent
                    : colors.textMuted
                }
              />
              <Text style={s.activityCount}>
                {issuesPRStats?.openPullRequests ?? 0}
              </Text>
              <Text style={s.activityLabel}>Pull Requests</Text>
              <Octicons
                name="chevron-right"
                size={12}
                color={colors.textMuted}
                style={{ marginLeft: "auto" }}
              />
            </Pressable>
          </>
        )}
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(400).delay(ANIM_DELAYS.actionBar)}
        style={s.actionRow}
      >
        <Pressable
          style={({ pressed }) => [
            s.actionButton,
            s.actionButtonOutline,
            pressed && s.actionButtonPressed,
          ]}
          onPress={handleCodePress}
          onPressIn={handleCodePressIn}
        >
          <Octicons name="code" size={IconSize.sm} color={colors.textPrimary} />
          <Text style={s.actionButtonOutlineText}>Code</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            s.actionButton,
            s.actionButtonFilled,
            pressed && s.actionButtonPressed,
          ]}
          onPress={handleCommitsPress}
          onPressIn={handleCommitsPressIn}
        >
          <Octicons
            name="history"
            size={IconSize.sm}
            color={colors.textOnAccent}
          />
          <Text style={s.actionButtonFilledText}>Commits</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            s.actionButton,
            s.actionButtonOutline,
            pressed && s.actionButtonPressed,
          ]}
          onPress={handleShare}
        >
          <Octicons
            name="share"
            size={IconSize.sm}
            color={colors.textPrimary}
          />
          <Text style={s.actionButtonOutlineText}>Share</Text>
        </Pressable>
      </Animated.View>

      {(lastCommit || isLoading.core) && (
        <Animated.View
          entering={FadeInDown.duration(400).delay(ANIM_DELAYS.commitSpotlight)}
          style={s.commitSpotlightCard}
        >
          {isLoading.core ? (
            <View style={s.commitSpotlightContent}>
              <View style={[s.skeleton, { width: "80%", height: 15 }]} />
              <View
                style={[s.skeleton, { width: "50%", height: 12, marginTop: 4 }]}
              />
            </View>
          ) : (
            <View style={s.commitSpotlightContent}>
              <Text style={s.commitMessage} numberOfLines={2} selectable>
                {lastCommit?.commit.message.split("\n")[0]}
              </Text>
              <View style={s.commitMetaRow}>
                <Text style={s.commitMeta} selectable>
                  {lastCommit?.commit.author.name} ·{" "}
                  {relativeTime(lastCommit?.commit.author.date ?? "")}
                </Text>
                {lastCommit && (
                  <Pressable
                    onPress={handleCopyHash}
                    hitSlop={8}
                    style={s.hashButton}
                  >
                    <Text style={s.hashText}>
                      {copiedHash ? "Copied!" : lastCommit.sha.slice(0, 7)}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      )}

      {!(languages.length === 0 && !isLoading.core) && (
        <Animated.View
          entering={FadeInDown.duration(400).delay(ANIM_DELAYS.languages)}
          style={s.languageCard}
        >
          <View style={s.languageCardHeader}>
            <Text style={s.sectionLabel}>Languages</Text>
            {!isLoading.core && languages.length > 0 && (
              <Text style={s.languageTotalBytes}>
                {formatBytes(languages.reduce((sum, l) => sum + l.bytes, 0))}
              </Text>
            )}
          </View>
          <LanguageBar languages={languages} isLoading={isLoading.core} />
        </Animated.View>
      )}

      <Animated.View
        entering={FadeInDown.duration(400).delay(ANIM_DELAYS.contributors)}
        style={s.section}
      >
        <Text style={s.sectionLabel}>Contributors</Text>
        {isLoading.contributors ? (
          <View style={s.skeletonAvatars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View
                key={i}
                style={[
                  s.skeleton,
                  {
                    width: IconSize.xl,
                    height: IconSize.xl,
                    borderRadius: Radius.full,
                  },
                ]}
              />
            ))}
          </View>
        ) : contributors.length === 0 ? (
          <Text style={s.noContributors}>No contributors</Text>
        ) : (
          <>
            <ContributorRow contributors={contributors} />
            <Text style={s.contributorCount}>
              {contributors.length === 1
                ? "1 contributor"
                : `${contributors.length} contributors`}
            </Text>
          </>
        )}
      </Animated.View>

      {readme && (
        <Animated.View
          entering={FadeInDown.duration(400).delay(ANIM_DELAYS.readme)}
          style={s.readmeSection}
        >
          <MarkdownRenderer markdown={readme} context={`${owner}/${repoName}`} />
        </Animated.View>
      )}
    </ScrollView>
  );
}

function StatItem({
  icon,
  value,
  label,
  colors,
  isLoading,
  iconColor,
}: {
  icon: React.ComponentProps<typeof Octicons>["name"];
  value: number;
  label: string;
  colors: typeof LightColors | typeof DarkColors;
  isLoading: boolean;
  iconColor?: string;
}) {
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
        <View
          style={{
            width: 40,
            height: 16,
            borderRadius: Radius.sm,
            backgroundColor: colors.surfaceSecondary,
          }}
        />
        <View
          style={{
            width: 30,
            height: 11,
            borderRadius: Radius.sm,
            backgroundColor: colors.surfaceSecondary,
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
      <Octicons
        name={icon}
        size={14}
        color={iconColor ?? colors.textSecondary}
      />
      <Text
        style={{
          fontFamily: FontFamily.semiBold,
          fontSize: FontSize.body,
          color: colors.textPrimary,
          fontVariant: ["tabular-nums"],
        }}
      >
        {formatCount(value)}
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

function buildStyles(
  colors: typeof LightColors | typeof DarkColors,
  bottomInset: number,
) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingHorizontal: Layout.screenPadding,
      paddingVertical: Spacing.lg,
      gap: Spacing.lg,
      paddingBottom: bottomInset,
    },

    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.md,
      padding: Spacing.xl,
      backgroundColor: colors.background,
    },

    section: {
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },

    sectionLabel: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    headerCard: {
      padding: Spacing.md,
      gap: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },

    ownerText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },

    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: Spacing.xs,
    },

    repoName: {
      flexShrink: 1,
      fontFamily: FontFamily.bold,
      fontSize: FontSize.heading,
      color: colors.textPrimary,
    },

    badge: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderWidth: BorderWidth.normal,
    },

    badgeText: {
      fontFamily: FontFamily.medium,
      fontSize: 10,
    },

    healthBadgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
      marginTop: 2,
    },

    healthBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 5,
      borderWidth: BorderWidth.normal,
    },

    healthBadgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    healthBadgeText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
    },

    description: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textSecondary,
      lineHeight: FontSize.body * 1.5,
    },

    websiteRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },

    websiteText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textLink,
      flex: 1,
    },

    topicsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
    },

    topicPill: {
      backgroundColor: colors.accentSubtle,
      borderRadius: Radius.full,
      borderWidth: BorderWidth.normal,
      borderColor: colors.accentMuted,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },

    topicText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.accent,
    },

    licenseRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },

    licenseText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },

    statsCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },

    statDivider: {
      width: 1,
      height: 36,
      backgroundColor: colors.border,
    },

    activityCard: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },

    activityRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      padding: Spacing.md,
    },

    activityCount: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
      fontVariant: ["tabular-nums"],
    },

    activityLabel: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textSecondary,
    },

    activityDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: Spacing.md,
    },

    commitSpotlightCard: {
      padding: Spacing.md,
      gap: Spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: BorderWidth.normal,
      borderColor: colors.border,
    },

    commitSpotlightContent: {
      gap: Spacing.xs,
    },

    commitMessage: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textPrimary,
      lineHeight: FontSize.body * 1.5,
    },

    commitMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },

    commitMeta: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
      flex: 1,
    },

    hashButton: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderWidth: BorderWidth.normal,
      borderColor: colors.border,
    },

    hashText: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
    },

    languageCard: {
      padding: Spacing.md,
      gap: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },

    languageCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    languageTotalBytes: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textMuted,
    },

    skeletonAvatars: {
      flexDirection: "row",
      gap: Spacing.sm,
    },

    noContributors: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textMuted,
    },

    contributorCount: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textSecondary,
    },

    readmeSection: {},

    actionRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },

    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      height: 44,
      borderRadius: Radius.md,
    },

    actionButtonPressed: {
      opacity: 0.75,
      transform: [{ scale: 0.96 }],
    },

    actionButtonOutline: {
      borderWidth: BorderWidth.normal,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },

    actionButtonOutlineText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
    },

    actionButtonFilled: {
      backgroundColor: colors.accent,
    },

    actionButtonFilledText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textOnAccent,
    },

    viewReadmeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: Spacing.md,
    },

    viewReadmeContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      flex: 1,
    },

    viewReadmeText: {
      flex: 1,
      gap: 2,
    },

    viewReadmeTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
    },

    viewReadmeSubtitle: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textMuted,
    },

    skeleton: {
      borderRadius: Radius.sm,
      backgroundColor: colors.surfaceSecondary,
    },

    errorTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textPrimary,
    },

    errorSubtitle: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textMuted,
      textAlign: "center",
    },

    retryButton: {
      backgroundColor: colors.accent,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      marginTop: Spacing.sm,
    },

    retryText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textOnAccent,
    },
  });
}
