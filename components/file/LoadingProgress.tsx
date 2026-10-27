import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import {
  FontFamily,
  FontSize,
  Spacing,
  useTheme,
  type ColorTokens,
} from "@/constants/theme";

interface LoadingProgressProps {
  isLoading: boolean;
  fileName: string;
}

export function LoadingProgress({ isLoading, fileName }: LoadingProgressProps) {
  const { colors } = useTheme();
  const s = useMemo(() => buildStyles(colors), [colors]);

  if (!isLoading) return null;

  return (
    <View style={s.centered}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={s.loadingText}>{`Loading ${fileName}...`}</Text>
    </View>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.xl,
      gap: Spacing.md,
      minHeight: 300,
    },

    loadingText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textMuted,
    },
  });
}
