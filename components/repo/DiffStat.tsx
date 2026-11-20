import { type ColorTokens, FontFamily, FontSize, useTheme } from "@/constants/theme";
import type { GitHubPullRequestFile } from "@/types/github.types";
import { Octicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { type StyleProp, Text, type TextStyle } from "react-native";

export function getFileStatusDisplay(
  status: GitHubPullRequestFile["status"],
  colors: ColorTokens,
): { icon: ComponentProps<typeof Octicons>["name"]; color: string } {
  switch (status) {
    case "added":
      return { icon: "diff-added", color: colors.success };
    case "removed":
      return { icon: "diff-removed", color: colors.danger };
    case "renamed":
      return { icon: "diff-renamed", color: colors.textMuted };
    default:
      return { icon: "diff-modified", color: colors.warning };
  }
}

export function DiffStat({
  additions,
  deletions,
  style,
}: {
  additions: number;
  deletions: number;
  style?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();
  return (
    <Text style={[{ fontFamily: FontFamily.mono, fontSize: FontSize.caption }, style]}>
      <Text style={{ color: colors.success }}>+{additions.toLocaleString()}</Text>
      <Text style={{ color: colors.textMuted }}> / </Text>
      <Text style={{ color: colors.danger }}>−{deletions.toLocaleString()}</Text>
    </Text>
  );
}
