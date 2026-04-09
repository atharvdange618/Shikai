import { DarkColors, LightColors, Spacing } from "@/constants/theme";
import { useUser } from "@/hooks/useUser";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OverviewScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = isDark ? DarkColors : LightColors;

  const { data: user, isLoading, error } = useUser();

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
          Error loading user data
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Overview
        </Text>
        <Text style={{ color: colors.textSecondary }}>
          Welcome, {user?.login}!
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: Spacing.md,
  },
});
