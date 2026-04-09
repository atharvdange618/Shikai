import { Card } from "@/components";
import { DarkColors, LightColors, Spacing } from "@/constants/theme";
import { useRepos } from "@/hooks/useRepos";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReposScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const router = useRouter();

  const { repos, isLoading, error } = useRepos();

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
          Error loading repositories
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <FlatList
        data={repos}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <Card style={styles.repoCard}>
            <Text style={[styles.repoName, { color: colors.textPrimary }]}>
              {item.name}
            </Text>
            {item.description && (
              <Text style={{ color: colors.textSecondary }} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            <Pressable
              style={[
                styles.testButton,
                { backgroundColor: colors.accentSubtle },
              ]}
              onPress={() =>
                router.push(`/commits/${item.owner.login}__${item.name}`)
              }
            >
              <Text style={[styles.testButtonText, { color: colors.accent }]}>
                View Commits (Test)
              </Text>
            </Pressable>
          </Card>
        )}
      />
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
  repoCard: {
    marginBottom: Spacing.md,
  },
  repoName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  testButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
    alignItems: "center",
  },
  testButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
