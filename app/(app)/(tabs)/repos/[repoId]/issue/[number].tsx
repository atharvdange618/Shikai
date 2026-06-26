import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import {
  DarkColors,
  FontFamily,
  FontSize,
  IconSize,
  Layout,
  LightColors,
  Radius,
  Spacing,
} from "@/constants/theme";
import { useIssueComments, useIssueDetail } from "@/hooks/useIssueDetail";
import { relativeTime } from "@/lib/utils";
import { Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

export default function IssueDetailScreen() {
  const { repoId, number } = useLocalSearchParams<{
    repoId: string;
    number: string;
  }>();
  const navigation = useNavigation();
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;

  const [owner, repoName] = (repoId ?? "").split("__");
  const issueNumber = Number(number);

  const {
    data: issue,
    isLoading,
    isError,
  } = useIssueDetail(owner, repoName, issueNumber);
  const { data: commentsData } = useIssueComments(owner, repoName, issueNumber);
  const comments = commentsData?.comments ?? [];

  const isOpen = issue?.state === "open";
  const stateColor = isOpen ? colors.success : colors.textMuted;

  useEffect(() => {
    try {
      navigation.setOptions({ title: `#${issueNumber}` });
    } catch {}
  }, [navigation, issueNumber]);

  if (isLoading) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isError || !issue) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <Octicons name="alert" size={IconSize.xl} color={colors.danger} />
        <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>
          Failed to load issue
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
      {/* Title + state icon */}
      <View style={s.titleRow}>
        <Octicons
          name={isOpen ? "issue-opened" : "issue-closed"}
          size={22}
          color={stateColor}
        />
        <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={5}>
          {issue.title}
        </Text>
      </View>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <View style={s.labelsRow}>
          {issue.labels.map((label) => (
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

      {/* Author bar */}
      <View style={s.authorBar}>
        <Image
          source={{ uri: issue.user.avatar_url }}
          style={s.authorAvatar}
          contentFit="cover"
          transition={100}
        />
        <Text style={[s.authorName, { color: colors.textPrimary }]}>
          {issue.user.login}
        </Text>
        <Text style={[s.authorTime, { color: colors.textMuted }]}>
          opened {relativeTime(issue.created_at)}
        </Text>
      </View>

      {/* Body */}
      {issue.body && (
        <View
          style={[
            s.bodySection,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <MarkdownRenderer markdown={issue.body} />
        </View>
      )}

      {/* Separator before comments */}
      {comments.length > 0 && (
        <View style={[s.separator, { backgroundColor: colors.border }]} />
      )}

      {/* Comments */}
      {comments.map((comment, index) => (
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
              <Text
                style={[s.commentAuthor, { color: colors.textPrimary }]}
              >
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
