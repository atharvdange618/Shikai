import { Octicons } from "@expo/vector-icons";
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  BorderWidth,
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";

interface FirstBookmarkNudgeProps {
  visible: boolean;
  onDismiss: () => void;
}

export const FirstBookmarkNudge = memo(function FirstBookmarkNudge({
  visible,
  onDismiss,
}: FirstBookmarkNudgeProps) {
  const { colors } = useTheme();
  const s = useMemo(() => buildStyles(colors), [colors]);

  if (!visible) return null;

  return (
    <View style={s.container}>
      <View style={s.content}>
        <Octicons name="bookmark" size={14} color={colors.accent} />
        <Text style={s.text}>
          Nice! Check your saved repos anytime from the Profile tab.
        </Text>
      </View>
      <Pressable onPress={onDismiss} hitSlop={8}>
        <Octicons name="x" size={12} color={colors.textMuted} />
      </Pressable>
    </View>
  );
});

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
      borderWidth: BorderWidth.normal,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },

    content: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      flex: 1,
    },

    text: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textSecondary,
      flex: 1,
    },
  });
}
