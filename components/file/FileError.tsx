import { Octicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  FontFamily,
  FontSize,
  IconSize,
  Spacing,
  useTheme,
  type ColorTokens,
} from "@/constants/theme";

interface FileErrorProps {
  title: string;
  message?: string;
}

export function FileError({ title, message }: FileErrorProps) {
  const { colors } = useTheme();
  const s = useMemo(() => buildStyles(colors), [colors]);

  return (
    <View style={s.centered}>
      <Octicons name="alert" size={IconSize.lg} color={colors.danger} />
      <Text style={s.errorText}>{title}</Text>
      {message !== undefined && <Text style={s.errorSubtext}>{message}</Text>}
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

    errorText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      textAlign: "center",
      color: colors.danger,
    },

    errorSubtext: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      textAlign: "center",
      color: colors.textMuted,
    },
  });
}
