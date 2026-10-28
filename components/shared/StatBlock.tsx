import { Pressable, StyleSheet, Text, View } from "react-native";

import { FontFamily, FontSize, Spacing, useTheme } from "@/constants/theme";

interface StatBlockProps {
  value: number;
  label: string;
  isLoading: boolean;
  onPress?: () => void;
}

/** A profile count (repos, followers, following); tappable when onPress is set. */
export function StatBlock({
  value,
  label,
  isLoading,
  onPress,
}: StatBlockProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && onPress && { opacity: 0.6 },
      ]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
    >
      {isLoading ? (
        <>
          <View
            style={[
              styles.skeleton,
              {
                width: 48,
                height: 22,
                backgroundColor: colors.surfaceSecondary,
              },
            ]}
          />
          <View
            style={[
              styles.skeleton,
              {
                width: 64,
                height: 13,
                backgroundColor: colors.surfaceSecondary,
              },
            ]}
          />
        </>
      ) : (
        <>
          <Text style={[styles.value, { color: colors.textPrimary }]}>
            {value.toLocaleString()}
          </Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  value: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.title,
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
  },
  skeleton: {
    borderRadius: 4,
  },
});
