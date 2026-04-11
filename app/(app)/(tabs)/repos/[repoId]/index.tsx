import { Octicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
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
import { formatCount, relativeTime } from "@/lib/utils";

export default function RepoDetailsScreen() {
  const { repoId } = useLocalSearchParams<{ repoId: string }>();
  const navigation = useNavigation();
  const router = useRouter();
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
    contributors,
    readme,
    isLoading,
    isError,
    error,
    refetch,
  } = useRepoDetailsScreen(owner, repoName);

  useEffect(() => {
    if (repo?.name) {
      navigation.setOptions({
        title: repo.name,
        headerBackVisible: true,
      });
    }
  }, [repo?.name, navigation]);

  const handleCopyHash = useCallback(async () => {
    if (!lastCommit?.sha) return;
    await Clipboard.setStringAsync(lastCommit.sha);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  }, [lastCommit?.sha]);

  const handleCommitsPress = useCallback(() => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/(app)/(tabs)/repos/${repoId}/commits`);
  }, [router, repoId]);

  const handleCodePress = useCallback(() => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/(app)/(tabs)/repos/${repoId}/files`);
  }, [router, repoId]);

  const handleViewOnGitHub = useCallback(() => {
    if (!repo?.html_url) return;
    WebBrowser.openBrowserAsync(`${repo.html_url}#readme`);
  }, [repo?.html_url]);

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
          style={s.section}
        >
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
            {repo && (
              <View
                style={[
                  s.badge,
                  {
                    backgroundColor: repo.private
                      ? colors.badgePrivateBg
                      : colors.badgePublicBg,
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
        </Animated.View>

        {repo?.topics && repo.topics.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={s.topicsRow}
          >
            {repo.topics.map((topic) => (
              <View key={topic} style={s.topicPill}>
                <Text style={s.topicText}>{topic}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
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

        {(lastCommit || isLoading.core) && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(300)}
            style={[s.card, s.commitCard]}
          >
            <Octicons name="git-commit" size={14} color={colors.textMuted} />
            <View style={s.commitInfo}>
              {isLoading.core ? (
                <>
                  <View style={[s.skeleton, { width: "80%", height: 14 }]} />
                  <View
                    style={[
                      s.skeleton,
                      { width: "40%", height: 11, marginTop: 4 },
                    ]}
                  />
                </>
              ) : (
                <>
                  <Text style={s.commitMessage} numberOfLines={2} selectable>
                    {lastCommit?.commit.message.split("\n")[0]}
                  </Text>
                  <Text style={s.commitMeta} selectable>
                    {lastCommit?.commit.author.name} ·{" "}
                    {relativeTime(lastCommit?.commit.author.date ?? "")}
                  </Text>
                </>
              )}
            </View>
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
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.duration(400).delay(400)}
          style={s.section}
        >
          <Text style={s.sectionLabel}>Languages</Text>
          <LanguageBar languages={languages} isLoading={isLoading.core} />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(500)}
          style={s.section}
        >
          <Text style={s.sectionLabel}>Contributors</Text>
          <ContributorRow
            contributors={contributors}
            isLoading={isLoading.contributors}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(600)}
          style={s.actionRow}
        >
          <Pressable
            style={({ pressed }) => [
              s.actionButton,
              s.actionButtonOutline,
              pressed && s.actionButtonPressed,
            ]}
            onPress={handleCodePress}
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
          >
            <Octicons name="history" size={IconSize.sm} color="#fff" />
            <Text style={s.actionButtonFilledText}>Commits</Text>
          </Pressable>
        </Animated.View>

        {readme && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(700)}
            style={s.section}
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

    badge: {
      borderRadius: Radius.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
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
      paddingHorizontal: Spacing.sm,
    },

    statDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.border,
    },

    commitCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: Spacing.md,
      gap: Spacing.sm,
    },

    commitInfo: {
      flex: 1,
      gap: 3,
    },

    commitMessage: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textPrimary,
      lineHeight: FontSize.label * 1.5,
    },

    commitMeta: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
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
      color: "#FFFFFF",
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
      color: "#FFFFFF",
    },
  });
}
