import { Card } from "@/components";
import { DarkColors, LightColors, Spacing } from "@/constants/theme";
import { useStarred } from "@/hooks/useStarred";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StarsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = isDark ? DarkColors : LightColors;

  const { repos: starred, isLoading, error } = useStarred();

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
          Error loading starred repositories
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
        data={starred}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <Card style={styles.repoCard}>
            <Text style={[styles.repoName, { color: colors.textPrimary }]}>
              {item.name}
            </Text>
            <Text style={[styles.owner, { color: colors.textSecondary }]}>
              {item.owner.login}
            </Text>
            {item.description && (
              <Text style={{ color: colors.textSecondary }} numberOfLines={2}>
                {item.description}
              </Text>
            )}
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
  owner: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
});
