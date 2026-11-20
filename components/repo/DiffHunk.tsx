import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FontFamily, Spacing, useTheme, type ColorTokens } from "@/constants/theme";
import { renderSyntaxNodes } from "@/components/file/renderSyntaxNodes";
import { highlightDiff, type DiffLine } from "@/lib/highlight";

const SIGN: Partial<Record<DiffLine["kind"], string>> = {
  add: "+",
  del: "-",
  context: " ",
};

export function DiffHunk({ hunk, fileName }: { hunk: string; fileName: string }) {
  const { colors, syntaxTheme } = useTheme();
  const s = useMemo(() => buildStyles(colors), [colors]);
  const { lines } = useMemo(() => highlightDiff(hunk, fileName), [hunk, fileName]);
  const digits = String(
    lines.reduce((max, l) => Math.max(max, l.oldLine ?? 0, l.newLine ?? 0), 0),
  ).length;

  return (
    <View style={s.container}>
      {lines.map((line, i) => {
        const sign = SIGN[line.kind];
        return (
          <View key={i} style={[s.row, s[line.kind]]}>
            {sign !== undefined && (
              <Text style={s.gutter}>
                {`${String(line.oldLine ?? "").padStart(digits)} ${String(line.newLine ?? "").padStart(digits)} ${sign}`}
              </Text>
            )}
            <Text
              style={[
                s.code,
                sign === undefined && s.muted,
                { color: sign === undefined ? colors.textMuted : syntaxTheme.foreground },
              ]}
            >
              {renderSyntaxNodes(line.nodes, syntaxTheme)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      paddingVertical: Spacing.xs,
      borderRadius: 6,
      overflow: "hidden",
      backgroundColor: colors.background,
    },
    row: {
      flexDirection: "row",
      paddingHorizontal: Spacing.sm,
      borderLeftWidth: 3,
      borderLeftColor: "transparent",
    },
    add: {
      backgroundColor: colors.successSubtle,
      borderLeftColor: colors.success,
    },
    del: {
      backgroundColor: colors.dangerSubtle,
      borderLeftColor: colors.danger,
    },
    context: {},
    hunk: { backgroundColor: colors.surfaceSecondary },
    meta: {},
    gutter: {
      fontFamily: FontFamily.mono,
      fontSize: 12,
      lineHeight: 18,
      color: colors.textMuted,
      marginRight: Spacing.sm,
    },
    code: {
      flex: 1,
      fontFamily: FontFamily.mono,
      fontSize: 12,
      lineHeight: 18,
    },
    muted: { fontStyle: "italic" },
  });
}
