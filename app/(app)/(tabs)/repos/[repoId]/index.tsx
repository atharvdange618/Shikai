import { DarkColors, LightColors, Spacing } from "@/constants/theme";
import { useRepoDetailsScreen } from "@/hooks/useRepoDetails";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RepoDetailsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = isDark ? DarkColors : LightColors;

  const { repoId } = useLocalSearchParams<{ repoId: string }>();
  // deconstruct repoid into owner and repo name
  // repoId is in the format "owner__repo"
  // split repoId into owner and repo name
  const [owner, repoName] = (repoId as string).split("__");

  const { repo, isLoading, error } = useRepoDetailsScreen(owner, repoName);

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
        <Text style={{ color: colors.textPrimary }}>
          Error loading repository details
        </Text>
      </SafeAreaView>
    );
  }

  if (!repo) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Text style={{ color: colors.textPrimary }}>Repository not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.repoName, { color: colors.textPrimary }]}>
          {repo.name}
        </Text>
        {repo.description && (
          <Text style={{ color: colors.textSecondary }}>
            {repo.description}
          </Text>
        )}
        <Text style={{ color: colors.textSecondary }}>
          Stars: {repo.stargazers_count} | Forks: {repo.forks_count}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  repoName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: Spacing.sm,
  },
});
