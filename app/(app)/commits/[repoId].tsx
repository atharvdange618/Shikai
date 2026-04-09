import { Card } from "@/components";
import {
  DarkColors,
  FontFamily,
  LightColors,
  Spacing,
} from "@/constants/theme";
import { useCommits } from "@/hooks/useRepoDetails";
import { Octicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CommitsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = isDark ? DarkColors : LightColors;

  const { repoId } = useLocalSearchParams<{ repoId: string }>();
  const [owner, repoName] = (repoId as string).split("__");

  const {
    commits,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommits(owner, repoName);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Text style={{ color: colors.textPrimary }}>Error loading commits</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <FlatList
        data={commits}
        keyExtractor={(item) => item.sha}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => {
          const commitMessage = item.commit.message.split("\n")[0];
          const commitDate = new Date(item.commit.author.date);
          const relativeTime = getRelativeTime(commitDate);

          return (
            <Card style={styles.commitCard}>
              <View style={styles.commitHeader}>
                <Octicons
                  name="git-commit"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.commitMessage, { color: colors.textPrimary }]}
                  numberOfLines={2}
                >
                  {commitMessage}
                </Text>
              </View>

              <View style={styles.commitMeta}>
                <Text style={[styles.author, { color: colors.textSecondary }]}>
                  {item.commit.author.name}
                </Text>
                <Text style={[styles.dot, { color: colors.textMuted }]}>•</Text>
                <Text style={[styles.date, { color: colors.textMuted }]}>
                  {relativeTime}
                </Text>
              </View>

              <Text
                style={[styles.sha, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {item.sha.substring(0, 7)}
              </Text>
            </Card>
          );
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              size="small"
              color={colors.accent}
              style={styles.footer}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return date.toLocaleDateString();
  } else if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else if (diffMins > 0) {
    return `${diffMins}m ago`;
  } else {
    return "just now";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  commitCard: {
    marginBottom: Spacing.md,
  },
  commitHeader: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  commitMessage: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    lineHeight: 20,
  },
  commitMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  author: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  dot: {
    fontSize: 13,
  },
  date: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  sha: {
    fontSize: 12,
    fontFamily: FontFamily.mono,
  },
  footer: {
    paddingVertical: Spacing.md,
  },
});
