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

interface AppRatingPromptProps {
  visible: boolean;
  onRate: () => void;
  onDismiss: () => void;
}

export const AppRatingPrompt = memo(function AppRatingPrompt({
  visible,
  onRate,
  onDismiss,
}: AppRatingPromptProps) {
  const { colors } = useTheme();
  const s = useMemo(() => buildStyles(colors), [colors]);

  if (!visible) return null;

  return (
    <View style={s.overlay}>
      <View style={s.card}>
        <View style={s.stars}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Octicons key={i} name="star-fill" size={20} color={colors.accent} />
          ))}
        </View>
        <Text style={s.title}>Enjoying Shikai?</Text>
        <Text style={s.body}>
          If you find it useful, a rating on the Play Store helps others
          discover it.
        </Text>
        <View style={s.actions}>
          <Pressable style={s.rateButton} onPress={onRate}>
            <Text style={s.rateButtonText}>Rate Shikai</Text>
          </Pressable>
          <Pressable style={s.dismissButton} onPress={onDismiss}>
            <Text style={s.dismissButtonText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: Spacing.xl,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.xl,
      borderWidth: BorderWidth.normal,
      borderColor: colors.border,
      padding: Spacing.xl,
      width: "100%",
      maxWidth: 340,
      alignItems: "center",
      gap: Spacing.md,
    },

    stars: {
      flexDirection: "row",
      gap: 4,
    },

    title: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.heading,
      color: colors.textPrimary,
    },

    body: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
    },

    actions: {
      width: "100%",
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },

    rateButton: {
      backgroundColor: colors.accent,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: "center",
    },

    rateButtonText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textOnAccent,
    },

    dismissButton: {
      borderRadius: Radius.md,
      paddingVertical: Spacing.sm,
      alignItems: "center",
    },

    dismissButtonText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textMuted,
    },
  });
}
