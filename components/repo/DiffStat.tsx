import { type ColorTokens, FontFamily, FontSize, useTheme } from "@/constants/theme";
import type { GitHubPullRequestFile } from "@/types/github.types";
import { Octicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { type StyleProp, Text, type TextStyle } from "react-native";

/** Icon and color for a changed file's status, shared by every file list. */
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

/**
 * `+12 / −3`, green and red. The one place a diff's counts get a color, so a
 * list that tints them green/red reads the same as every other list.
 */
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
    <Text
      style={[
        { fontFamily: FontFamily.mono, fontSize: FontSize.caption },
        style,
      ]}
    >
      <Text style={{ color: colors.success }}>
        +{additions.toLocaleString()}
      </Text>
      <Text style={{ color: colors.textMuted }}> / </Text>
      <Text style={{ color: colors.danger }}>−{deletions.toLocaleString()}</Text>
    </Text>
  );
}
