import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import {
  FontFamily,
  FontSize,
  IconSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";
import {
  usePullRequestComments,
  usePullRequestDetail,
} from "@/hooks/usePullRequestDetail";
import { decodeRepoId, relativeTime } from "@/lib/utils";
import type { GitHubComment, GitHubLabel } from "@/types/github.types";
import { Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function PullRequestDetailScreen() {
  const { repoId, number } = useLocalSearchParams<{
    repoId: string;
    number: string;
  }>();
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const prNumber = Number(number);

  const {
    data: pr,
    isLoading,
    isError,
  } = usePullRequestDetail(owner, repoName, prNumber);
  const { data: commentsData } = usePullRequestComments(
    owner,
    repoName,
    prNumber,
  );
  const comments = commentsData?.comments ?? [];

  const isMerged = pr?.merged_at !== null;
  const isOpen = pr?.state === "open";

  let stateIcon: React.ComponentProps<typeof Octicons>["name"] =
    "git-pull-request";
  let stateColor: string = colors.success;

  if (pr?.draft) {
    stateIcon = "git-pull-request-draft";
    stateColor = colors.textMuted;
  } else if (isMerged) {
    stateIcon = "git-merge";
    stateColor = colors.merged;
  } else if (!isOpen) {
    stateIcon = "git-pull-request-closed";
    stateColor = colors.danger;
  }

  useEffect(() => {
    try {
      navigation.setOptions({ title: `#${prNumber}` });
    } catch {}
  }, [navigation, prNumber]);

  if (isLoading) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isError || !pr) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <Octicons name="alert" size={IconSize.xl} color={colors.danger} />
        <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>
          Failed to load pull request
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.titleRow}>
        <Octicons name={stateIcon} size={22} color={stateColor} />
        <View style={{ flex: 1 }}>
          <Text
            style={[s.title, { color: colors.textPrimary }]}
            numberOfLines={5}
          >
            {pr.title}
          </Text>
          {pr.draft && (
            <View style={s.draftBadge}>
              <Text style={[s.draftText, { color: colors.textMuted }]}>
                Draft
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.branchRow}>
        <Octicons name="git-branch" size={12} color={colors.textMuted} />
        <Text style={[s.branchText, { color: colors.textSecondary }]}>
          {pr.base.ref} <Text style={{ color: colors.textMuted }}>←</Text>{" "}
          {pr.head.ref}
        </Text>
      </View>

      {pr.labels.length > 0 && (
        <View style={s.labelsRow}>
          {pr.labels.map((label: GitHubLabel) => (
            <View
              key={label.id}
              style={[
                s.labelPill,
                {
                  backgroundColor: `#${label.color}20`,
                },
              ]}
            >
              <Text style={[s.labelText, { color: `#${label.color}` }]}>
                {label.name}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={s.authorBar}>
        <Image
          source={{ uri: pr.user.avatar_url }}
          style={s.authorAvatar}
          contentFit="cover"
          transition={100}
        />
        <Text style={[s.authorName, { color: colors.textPrimary }]}>
          {pr.user.login}
        </Text>
        <Text style={[s.authorTime, { color: colors.textMuted }]}>
          opened {relativeTime(pr.created_at)}
        </Text>
      </View>

      {pr.body && (
        <View
          style={[
            s.bodySection,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <MarkdownRenderer markdown={pr.body} />
        </View>
      )}

      {comments.length > 0 && (
        <View style={[s.separator, { backgroundColor: colors.border }]} />
      )}

      {comments.map((comment: GitHubComment, _index: number) => (
        <View key={comment.id}>
          <View
            style={[
              s.commentCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={s.commentHeader}>
              <Image
                source={{ uri: comment.user.avatar_url }}
                style={s.commentAvatar}
                contentFit="cover"
                transition={100}
              />
              <Text style={[s.commentAuthor, { color: colors.textPrimary }]}>
                {comment.user.login}
              </Text>
              <Text style={[s.commentTime, { color: colors.textMuted }]}>
                {relativeTime(comment.created_at)}
              </Text>
            </View>
            <MarkdownRenderer markdown={comment.body} />
          </View>
        </View>
      ))}

      <View style={{ height: Spacing.xxl + 60 + Spacing.lg }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl + 60 + Spacing.lg,
    gap: Spacing.md,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  emptyTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading,
    lineHeight: FontSize.heading * 1.35,
  },
  draftBadge: {
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    marginTop: Spacing.xs,
  },
  draftText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption,
  },

  branchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  branchText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.caption,
    flex: 1,
  },

  labelsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  labelPill: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
  },
  labelText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
  },

  authorBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  authorName: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
  },
  authorTime: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },

  bodySection: {
    marginTop: Spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.sm,
  },

  commentCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  commentAuthor: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
  },
  commentTime: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },
});
