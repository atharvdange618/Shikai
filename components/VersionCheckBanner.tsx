import { Radius, Spacing, TextStyles, useTheme } from "@/constants/theme";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

const DISMISS_KEY = "shikai_version_dismissed";

interface VersionCheckBannerProps {
  latestVersion: string;
  releaseUrl: string;
}

export function VersionCheckBanner({
  latestVersion,
  releaseUrl,
}: VersionCheckBannerProps) {
  const { colors } = useTheme();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const val = SecureStore.getItem(DISMISS_KEY);
    setDismissed(val === latestVersion);
  }, [latestVersion]);

  const handleDismiss = () => {
    setDismissed(true);
    SecureStore.setItem(DISMISS_KEY, latestVersion);
  };

  const handleUpdate = () => {
    Linking.openURL(releaseUrl);
  };

  if (dismissed || !latestVersion) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.accentSubtle,
          borderColor: colors.accentMuted,
          borderRadius: Radius.md,
          padding: Spacing.md,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={[TextStyles.label, { color: colors.textPrimary }]}>
          Update available
        </Text>
        <Text
          style={[
            TextStyles.caption,
            { color: colors.textSecondary, marginTop: 2 },
          ]}
        >
          v{latestVersion} is now available
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handleUpdate}
          style={[
            styles.button,
            styles.updateButton,
            { backgroundColor: colors.accent },
          ]}
        >
          <Text
            style={[
              TextStyles.label,
              { color: colors.textOnAccent, fontFamily: undefined },
            ]}
          >
            Update
          </Text>
        </Pressable>

        <Pressable
          onPress={handleDismiss}
          style={[styles.button, styles.dismissButton]}
        >
          <Text style={[TextStyles.caption, { color: colors.textMuted }]}>
            Dismiss
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    gap: 10,
  },
  content: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  updateButton: {
    alignItems: "center",
  },
  dismissButton: {
    alignItems: "center",
  },
});
