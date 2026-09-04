import { ErrorBoundary } from "@/components";
import { DiffFileList } from "@/components/repo/DiffFileList";
import {
  FontFamily,
  FontSize,
  IconSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";
import { useCommitDetail } from "@/hooks/useCommitDetail";
import { decodeRepoId, relativeTime } from "@/lib/utils";
import { Octicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CommitDetailScreen() {
  return (
    <ErrorBoundary fallback="back">
      <CommitDetailScreenContent />
    </ErrorBoundary>
  );
}

function CommitDetailScreenContent() {
  const { repoId, sha } = useLocalSearchParams<{ repoId: string; sha: string }>();
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");

  const { data: commit, isLoading, isError } = useCommitDetail(
    owner,
    repoName,
    sha ?? "",
  );

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      navigation.setOptions({ title: (sha ?? "").slice(0, 7) });
    } catch {}
  }, [navigation, sha]);

  if (isLoading) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isError || !commit) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <Octicons name="alert" size={IconSize.xl} color={colors.danger} />
        <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>
          Failed to load commit
        </Text>
      </View>
    );
  }

  const [subject, ...rest] = commit.commit.message.split("\n");
  const bodyText = rest.join("\n").trim();
  const authorName = commit.author?.login ?? commit.commit.author.name;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(commit.sha);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.titleRow}>
        <Octicons name="git-commit" size={22} color={colors.textMuted} />
        <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={5}>
          {subject}
        </Text>
      </View>

      <View style={s.authorBar}>
        {commit.author?.avatar_url ? (
          <Image
            source={{ uri: commit.author.avatar_url }}
            style={s.authorAvatar}
            contentFit="cover"
            transition={100}
          />
        ) : (
          <View style={[s.authorAvatar, { backgroundColor: colors.surfaceSecondary }]} />
        )}
        <Text style={[s.authorName, { color: colors.textPrimary }]}>
          {authorName}
        </Text>
        <Text style={[s.authorTime, { color: colors.textMuted }]}>
          committed {relativeTime(commit.commit.author.date)}
        </Text>
      </View>

      <View style={s.metaRow}>
        <Pressable
          onPress={handleCopy}
          hitSlop={8}
          style={[s.shaBadge, { backgroundColor: colors.surfaceSecondary }]}
        >
          <Octicons
            name={copied ? "check" : "copy"}
            size={11}
            color={copied ? colors.success : colors.textMuted}
          />
          <Text
            style={[
              s.shaText,
              { color: copied ? colors.success : colors.textSecondary },
            ]}
          >
            {copied ? "Copied" : commit.sha.slice(0, 7)}
          </Text>
        </Pressable>
        <Text style={[s.diffStat, { color: colors.textMuted }]}>
          <Text style={{ color: colors.success }}>+{commit.stats.additions}</Text>{" "}
          <Text style={{ color: colors.danger }}>-{commit.stats.deletions}</Text>
        </Text>
      </View>

      {bodyText.length > 0 && (
        <View
          style={[
            s.bodySection,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[s.bodyText, { color: colors.textSecondary }]}>
            {bodyText}
          </Text>
        </View>
      )}

      {commit.files.length > 0 && (
        <DiffFileList
          files={commit.files}
          colors={colors}
          repoContext={`${owner}/${repoName}`}
        />
      )}

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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  shaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  shaText: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
  },
  diffStat: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
  },
  bodySection: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  bodyText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.caption,
    lineHeight: FontSize.caption * 1.5,
  },
});
