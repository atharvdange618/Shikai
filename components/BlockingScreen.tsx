import { useTheme } from "@/constants/theme";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { setDevModeOverride } from "shikai-security";
import { useAlert } from "@/components/shared/Alert";

interface BlockingScreenProps {
  reasons: string[];
  devModeBlocked: boolean;
  onOverride?: () => void;
}

export function BlockingScreen({
  reasons,
  devModeBlocked,
  onOverride,
}: BlockingScreenProps) {
  const { colors, typography, spacing } = useTheme();
  const [loading, setLoading] = useState(false);
  const alert = useAlert();

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
      return () => sub.remove();
    }, []),
  );

  const handleOverride = async () => {
    alert.show({
      variant: "warning",
      title: "Developer Mode Override",
      message:
        "Enabling this override allows developer tools (ADB, USB debugging) to access your app data. This includes your account credentials, messages, and any locally stored information.\n\nOnly enable this if you trust the devices connected to your phone.",
      actions: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Enable override",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const success = await setDevModeOverride(true);
            setLoading(false);
            if (success) {
              onOverride?.();
            }
          },
        },
      ],
    });
  };

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

        {devModeBlocked && (
          <Pressable
            style={[
              styles.overrideButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                marginTop: spacing.xl,
              },
            ]}
            onPress={handleOverride}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textSecondary} />
            ) : (
              <Text style={[typography.label, { color: colors.textSecondary }]}>
                {"I'm a developer - allow anyway"}
              </Text>
            )}
          </Pressable>
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
  overrideButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    width: "100%",
    alignItems: "center",
  },
});
