import { Octicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
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

import { ContributorRow } from "@/components/repo/ContributorRow";
import { LanguageBar } from "@/components/repo/LanguageBar";
import { useRepoDetailsScreen } from "@/hooks/useRepoDetails";

import {
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
import {
  prefetchFileTree,
  prefetchRepoCommits,
  prefetchRoute,
} from "@/lib/prefetch";
import { formatCount, relativeTime } from "@/lib/utils";

export default function RepoDetailsScreen() {
  const { repoId } = useLocalSearchParams<{ repoId: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const shadows = isDark ? {} : Shadows.light.sm;

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
    prefetchRoute(`/(app)/(tabs)/repos/${repoId}/commits`);
    prefetchRepoCommits(queryClient, owner, repoName);
  }, [queryClient, owner, repoName, repoId]);

  const handleCodePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/(tabs)/repos/${repoId}/files`);
  }, [router, repoId]);

  const handleCodePressIn = useCallback(() => {
    if (!owner || !repoName) return;
    prefetchRoute(`/(app)/(tabs)/repos/${repoId}/files`);
    prefetchFileTree(queryClient, owner, repoName);
  }, [queryClient, owner, repoName, repoId]);

  const handleViewOnGitHub = useCallback(() => {
    if (!repo?.html_url) return;
    WebBrowser.openBrowserAsync(repo.html_url);
  }, [repo?.html_url]);

  const handleShare = useCallback(async () => {
    if (!repo) return;
    try {
      await Share.share({
        message: `Check out ${repo.full_name} on GitHub`,
        url: repo.html_url,
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
    prefetchRoute(`/(app)/(tabs)/repos/${repoId}/issues`);
  }, [owner, repoName, repoId]);

  const handlePRsPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/(tabs)/repos/${repoId}/pull-requests`);
  }, [router, repoId]);

  const handlePRsPressIn = useCallback(() => {
    if (!owner || !repoName) return;
    prefetchRoute(`/(app)/(tabs)/repos/${repoId}/pull-requests`);
  }, [owner, repoName, repoId]);

  const s = buildStyles(colors, shadows);

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
    <>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(400).delay(0)}
          style={[s.card, s.headerCard]}
        >
          {isLoading.core ? (
            <View style={[s.skeleton, { width: 80, height: 12 }]} />
          ) : (
            <Text style={s.ownerText}>{owner}</Text>
          )}

          <View style={s.titleRow}>
            <Octicons
              name="repo"
              size={IconSize.md}
              color={colors.textSecondary}
            />
            {isLoading.core ? (
              <View style={[s.skeleton, { flex: 1, height: 22 }]} />
            ) : (
              <Text style={s.repoName} numberOfLines={1}>
                {repo?.name}
              </Text>
            )}
          </View>

          {repo && (
            <View style={s.badgeRow}>
              {repo.fork && (
                <View
                  style={[
                    s.badge,
                    {
                      backgroundColor: colors.badgeForkBg,
                      borderColor: colors.accentMuted,
                    },
                  ]}
                >
                  <Text
                    style={[s.badgeText, { color: colors.badgeForkText }]}
                  >
                    Fork
                  </Text>
                </View>
              )}
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
            </View>
          )}

          {repo?.description && (
            <Text style={s.description} selectable>
              {repo.description}
            </Text>
          )}

          {repo?.homepage && (
            <Pressable
              style={s.websiteRow}
              onPress={() => Linking.openURL(repo.homepage!)}
            >
              <Octicons name="link" size={13} color={colors.accent} />
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
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(80)}
          style={[s.card, s.statsCard]}
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
            isLoading={isLoading.commitCount}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(160)}
          style={[s.card, s.activityCard]}
        >
          {issuesPRStats ? (
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
                    issuesPRStats.openIssues > 0
                      ? colors.success
                      : colors.textMuted
                  }
                />
                <Text style={s.activityCount}>
                  {issuesPRStats.openIssues}
                </Text>
                <Text style={s.activityLabel}>open issues</Text>
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
                    issuesPRStats.openPullRequests > 0
                      ? colors.accent
                      : colors.textMuted
                  }
                />
                <Text style={s.activityCount}>
                  {issuesPRStats.openPullRequests}
                </Text>
                <Text style={s.activityLabel}>open pull requests</Text>
                <Octicons
                  name="chevron-right"
                  size={12}
                  color={colors.textMuted}
                  style={{ marginLeft: "auto" }}
                />
              </Pressable>
            </>
          ) : isLoading.core ? (
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
          ) : null}

          {(lastCommit || isLoading.core) && (
            <>
              <View style={s.activityDivider} />
              <View style={s.commitSection}>
                <View style={s.commitHeader}>
                  <Octicons
                    name="git-commit"
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={s.commitSectionLabel}>Latest commit</Text>
                </View>
                {isLoading.core ? (
                  <View style={s.commitContent}>
                    <View
                      style={[s.skeleton, { width: "80%", height: 15 }]}
                    />
                    <View
                      style={[
                        s.skeleton,
                        { width: "50%", height: 12, marginTop: 4 },
                      ]}
                    />
                  </View>
                ) : (
                  <View style={s.commitContent}>
                    <Text
                      style={s.commitMessage}
                      numberOfLines={2}
                      selectable
                    >
                      {lastCommit?.commit.message.split("\n")[0]}
                    </Text>
                    <View style={s.commitMetaRow}>
                      <Text style={s.commitMeta} selectable>
                        {lastCommit?.commit.author.name} ·{" "}
                        {relativeTime(
                          lastCommit?.commit.author.date ?? "",
                        )}
                      </Text>
                      {lastCommit && (
                        <Pressable
                          onPress={handleCopyHash}
                          hitSlop={8}
                          style={s.hashButton}
                        >
                          <Text style={s.hashText}>
                            {copiedHash
                              ? "Copied!"
                              : lastCommit.sha.slice(0, 7)}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(240)}
          style={s.section}
        >
          <Text style={s.sectionLabel}>Languages</Text>
          <LanguageBar languages={languages} isLoading={isLoading.core} />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(240)}
          style={s.section}
        >
          <Text style={s.sectionLabel}>Contributors</Text>
          <ContributorRow
            contributors={contributors}
            isLoading={isLoading.contributors}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(320)}
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
            <Octicons
              name="code"
              size={IconSize.sm}
              color={colors.textPrimary}
            />
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
            <Octicons name="history" size={IconSize.sm} color="#fff" />
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

        {readme && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(320)}
          >
            <Pressable
              style={[s.card, s.viewReadmeButton]}
              onPress={handleViewOnGitHub}
            >
              <View style={s.viewReadmeContent}>
                <Octicons name="book" size={20} color={colors.accent} />
                <View style={s.viewReadmeText}>
                  <Text style={s.viewReadmeTitle}>View README</Text>
                  <Text style={s.viewReadmeSubtitle}>
                    Open on GitHub to read documentation
                  </Text>
                </View>
              </View>
              <Octicons
                name="chevron-right"
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </>
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
            borderRadius: 4,
            backgroundColor: colors.surfaceSecondary,
          }}
        />
        <View
          style={{
            width: 30,
            height: 11,
            borderRadius: 4,
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
  shadows: object,
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
      paddingBottom: Spacing.xxl,
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
    },

    sectionLabel: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    readmeHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    viewOnGitHubButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
    },

    viewOnGitHubText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.accent,
    },

    headerCard: {
      padding: Spacing.md,
      gap: Spacing.sm,
    },

    ownerText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },

    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },

    repoName: {
      flex: 1,
      fontFamily: FontFamily.bold,
      fontSize: FontSize.heading,
      color: colors.textPrimary,
    },

    badgeRow: {
      flexDirection: "row",
      gap: Spacing.xs,
    },

    badge: {
      borderRadius: Radius.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderWidth: 1,
    },

    badgeText: {
      fontFamily: FontFamily.medium,
      fontSize: 10,
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
      color: colors.accent,
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
      borderWidth: 1,
      borderColor: colors.accentMuted,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
    },

    topicText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.accent,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows,
    },

    statsCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
    },

    statDivider: {
      width: 1,
      height: 36,
      backgroundColor: colors.border,
    },

    activityCard: {
      overflow: "hidden",
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

    commitSection: {
      padding: Spacing.md,
    },

    commitHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      marginBottom: Spacing.sm,
    },

    commitSectionLabel: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },

    commitContent: {
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
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },

    hashText: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize.caption,
      color: colors.textSecondary,
    },

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
      height: 40,
      borderRadius: Radius.md,
    },

    actionButtonPressed: {
      opacity: 0.75,
      transform: [{ scale: 0.96 }],
    },

    actionButtonOutline: {
      borderWidth: 1,
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
      borderRadius: 4,
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
