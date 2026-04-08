import { DarkColors, LightColors } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth.store";
import { Octicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AppLayout() {
  const scheme = useColorScheme();
  const colors = scheme === "dark" ? DarkColors : LightColors;
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Octicons name="mark-github" size={64} color={colors.accent} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Welcome, {user?.login || "Developer"}! 👋
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your GitHub dashboard is being built...
        </Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.accentSubtle,
              borderColor: colors.border,
            },
          ]}
        >
          <Octicons name="check-circle" size={16} color={colors.accent} />
          <Text style={[styles.badgeText, { color: colors.accent }]}>
            All systems connected
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  iconContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
