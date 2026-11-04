import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PRHeader } from "@/components/repo/PRHeader";
import { PRList, PRPageState, prStyles as s } from "@/components/repo/PRList";
import {
  FontSize,
  Layout,
  Spacing,
  useTheme,
} from "@/constants/theme";
import { usePullRequestReviewComments } from "@/hooks/usePullRequestDetail";
import { buildThreads } from "@/lib/pr-review";
import { decodeRepoId, relativeTime } from "@/lib/utils";
import { Octicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ReviewsScreen() {
  return (
    <ErrorBoundary fallback="back">
      <Reviews />
    </ErrorBoundary>
  );
}
function Reviews() {
  const { repoId, number } = useLocalSearchParams<{
    repoId: string;
    number: string;
  }>();
  const [owner, repo] = decodeRepoId(repoId);
  const { colors } = useTheme();
  const query = usePullRequestReviewComments(owner, repo, Number(number));
  const threads = buildThreads(query.comments);
  return (
    <>
      <PRHeader title="Review threads" repoId={repoId} number={number} />
      <PRList
        data={threads}
        keyExtractor={(thread) => String(thread.root.id)}
        header={
          <Text style={[s.text, { color: colors.textSecondary }]}>
            {threads.length} threads
            {query.hasNextPage ? " loaded · more comments available" : ""} ·
            Grouped by file
          </Text>
        }
        renderItem={({ item: thread, index }) => {
          const showFile =
            index === 0 || threads[index - 1].path !== thread.path;
          const replies = thread.replies.length;
          const replyLabel = `${replies} ${replies === 1 ? "reply" : "replies"}`;
          return (
            <View style={styles.item}>
              {showFile && (
                <View
                  style={[
                    styles.fileHeader,
                    index === 0 && styles.fileHeaderFirst,
                  ]}
                >
                  <Octicons name="file" size={12} color={colors.textMuted} />
                  <Text
                    accessibilityRole="header"
                    numberOfLines={1}
                    ellipsizeMode="middle"
                    style={[s.mono, { flex: 1, color: colors.textSecondary }]}
                  >
                    {thread.path}
                  </Text>
                </View>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${thread.path}${thread.line ? ` line ${thread.line}` : ""}, ${thread.root.user.login}, ${replyLabel}`}
                onPress={() =>
                  router.push({
                    pathname:
                      "/(app)/repo/[repoId]/pr/[number]/thread/[threadId]",
                    params: {
                      repoId,
                      number,
                      threadId: String(thread.root.id),
                    },
                  })
                }
                style={({ pressed }) => [
                  s.card,
                  styles.card,
                  {
                    borderColor: colors.border,
                    backgroundColor: pressed
                      ? colors.surfaceSecondary
                      : colors.surface,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Octicons name="diff" size={12} color={colors.textMuted} />
                  <Text style={[s.mono, { color: colors.textMuted }]}>
                    {thread.line ? `line ${thread.line}` : "Outdated"}
                  </Text>
                  <View style={{ flex: 1 }} />
                  {replies > 0 && (
                    <>
                      <Octicons
                        name="comment"
                        size={12}
                        color={colors.textMuted}
                      />
                      <Text style={[s.meta, { color: colors.textMuted }]}>
                        {replies}
                      </Text>
                    </>
                  )}
                  <Octicons
                    name="chevron-right"
                    size={14}
                    color={colors.textMuted}
                  />
                </View>
                <Text
                  numberOfLines={2}
                  style={[styles.body, { color: colors.textPrimary }]}
                >
                  {thread.root.body}
                </Text>
                <View style={styles.authorRow}>
                  <Image
                    source={{ uri: thread.root.user.avatar_url }}
                    style={styles.avatar}
                    contentFit="cover"
                    transition={100}
                  />
                  <Text style={[s.meta, { color: colors.textSecondary }]}>
                    {thread.root.user.login}
                  </Text>
                  <Text style={[s.meta, { color: colors.textMuted }]}>
                    {relativeTime(thread.root.created_at)}
                  </Text>
                </View>
              </Pressable>
            </View>
          );
        }}
        footer={
          <PRPageState
            {...query}
            count={threads.length}
            emptyText="No code review threads"
          />
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  item: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.sm,
  },
  fileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  fileHeaderFirst: {
    paddingTop: 0,
  },
  card: {
    padding: Spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  body: {
    fontSize: FontSize.label,
    lineHeight: FontSize.label * 1.4,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  avatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
