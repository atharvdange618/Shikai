import { useTheme } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const { colors, typography, spacing, radius } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getVariantStyles = (): {
    container: ViewStyle;
    text: TextStyle;
  } => {
    switch (variant) {
      case "primary":
        return {
          container: {
            backgroundColor: disabled ? colors.surfaceSecondary : colors.accent,
          },
          text: {
            color: disabled ? colors.textMuted : colors.textOnAccent,
          },
        };
      case "secondary":
        return {
          container: {
            backgroundColor: disabled
              ? colors.surfaceSecondary
              : colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          },
          text: {
            color: disabled ? colors.textMuted : colors.textPrimary,
          },
        };
      case "outline":
        return {
          container: {
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: disabled ? colors.borderSubtle : colors.accent,
          },
          text: {
            color: disabled ? colors.textMuted : colors.accent,
          },
        };
      case "ghost":
        return {
          container: {
            backgroundColor: "transparent",
          },
          text: {
            color: disabled ? colors.textMuted : colors.accent,
          },
        };
      case "danger":
        return {
          container: {
            backgroundColor: disabled ? colors.surfaceSecondary : colors.danger,
          },
          text: {
            color: disabled ? colors.textMuted : colors.textOnAccent,
          },
        };
    }
  };

  const getSizeStyles = (): ViewStyle & TextStyle => {
    switch (size) {
      case "sm":
        return {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.sm,
          ...typography.label,
        };
      case "md":
        return {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          ...typography.bodyMedium,
        };
      case "lg":
        return {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          borderRadius: radius.md,
          ...typography.title,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variantStyles.container,
        {
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          borderRadius: sizeStyles.borderRadius,
          opacity: pressed ? 0.8 : 1,
          width: fullWidth ? "100%" : "auto",
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text
        style={[
          variantStyles.text,
          {
            fontFamily: sizeStyles.fontFamily,
            fontSize: sizeStyles.fontSize,
            lineHeight: sizeStyles.lineHeight,
          },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
});
