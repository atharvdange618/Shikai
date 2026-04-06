import { useTheme } from "@/constants/theme";
import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface CardProps {
  children: ReactNode;
  variant?: "default" | "secondary" | "inset";
  elevated?: boolean;
  padding?: keyof typeof import("@/constants/theme").Spacing;
  style?: ViewStyle;
}

export function Card({
  children,
  variant = "default",
  elevated = true,
  padding = "lg",
  style,
}: CardProps) {
  const { colors, radius, spacing, shadows, border } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case "default":
        return colors.surface;
      case "secondary":
        return colors.surfaceSecondary;
      case "inset":
        return colors.surfaceInset;
    }
  };

  const shadowStyle = elevated ? shadows.sm : {};

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: radius.lg,
          borderWidth: border.normal,
          borderColor: colors.border,
          padding: spacing[padding],
        },
        shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
});
