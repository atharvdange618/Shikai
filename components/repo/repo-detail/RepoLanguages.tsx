import { StyleSheet, Text, View } from "react-native";

import { LanguageBar } from "@/components/repo/LanguageBar";
import {
  FontFamily,
  FontSize,
  Spacing,
  type ColorTokens,
} from "@/constants/theme";
import type { LanguageShare } from "@/types/github.types";

import { formatBytes } from "./repo-detail-helpers";

interface RepoLanguagesProps {
  languages: LanguageShare[];
  isLoading: boolean;
  colors: ColorTokens;
}

export function RepoLanguages({
  languages,
  isLoading,
  colors,
}: RepoLanguagesProps) {
  const s = buildStyles(colors);
  const totalBytes = languages.reduce((sum, l) => sum + l.bytes, 0);

  return (
    <View style={s.languageCard}>
      <View style={s.languageCardHeader}>
        <Text style={s.sectionLabel}>Languages</Text>
        {!isLoading && languages.length > 0 && (
          <Text style={s.languageTotalBytes}>{formatBytes(totalBytes)}</Text>
        )}
      </View>
      <LanguageBar languages={languages} isLoading={isLoading} />
    </View>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    languageCard: {
      padding: Spacing.md,
      gap: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },

    languageCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    sectionLabel: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    languageTotalBytes: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.textMuted,
    },
  });
}
