import { useTheme } from "@/constants/theme";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { BackHandler, StyleSheet, Text, View } from "react-native";

interface BlockingScreenProps {
  reasons: string[];
  onRecheck?: () => void;
}

export function BlockingScreen({ reasons, onRecheck }: BlockingScreenProps) {
  const { colors, typography, spacing } = useTheme();

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
      return () => sub.remove();
    }, []),
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text
          style={[
            typography.display,
            { color: colors.textPrimary, textAlign: "center" },
          ]}
        >
          Security Blocked
        </Text>

        <Text
          style={[
            typography.body,
            {
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: spacing.md,
            },
          ]}
        >
          This app cannot run on this device due to security policies.
        </Text>

        {reasons.length > 0 && (
          <View style={[styles.reasons, { marginTop: spacing.xl }]}>
            {reasons.map((reason, i) => (
              <Text
                key={i}
                style={[
                  typography.label,
                  { color: colors.textMuted, textAlign: "center" },
                ]}
              >
                {reason}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 32,
    alignItems: "center",
  },
  reasons: {
    gap: 4,
  },
});
