import { Card } from "@/components";
import { DarkColors, LightColors, Spacing } from "@/constants/theme";
import { useUser } from "@/hooks/useUser";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
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
        <Text style={{ color: colors.textPrimary }}>Error loading profile</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {user?.avatar_url && (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        )}

        <Text style={[styles.name, { color: colors.textPrimary }]}>
          {user?.name || user?.login}
        </Text>

        <Text style={[styles.username, { color: colors.textSecondary }]}>
          @{user?.login}
        </Text>

        {user?.bio && (
          <Text style={[styles.bio, { color: colors.textSecondary }]}>
            {user.bio}
          </Text>
        )}

        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {user?.public_repos}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Repositories
              </Text>
            </View>

            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {user?.followers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Followers
              </Text>
            </View>

            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {user?.following}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Following
              </Text>
            </View>
          </View>
        </Card>
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
    alignItems: "center",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: Spacing.md,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: Spacing.xs,
  },
  username: {
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  bio: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  statsCard: {
    width: "100%",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
  },
});
