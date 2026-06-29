import {
  BorderWidth,
  Radius,
  Shadows,
  Spacing,
  useTheme,
} from "@/constants/theme";
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
  const { colors } = useTheme();

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

  const shadowStyle = elevated ? Shadows.light.sm : {};

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: Radius.lg,
          borderWidth: BorderWidth.normal,
          borderColor: colors.border,
          padding: Spacing[padding],
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
