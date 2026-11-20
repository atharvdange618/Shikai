import { ErrorBoundary } from "@/components/ErrorBoundary";
import { renderSyntaxNodes } from "@/components/file/renderSyntaxNodes";
import {
  FontFamily,
  FontSize,
  IconSize,
  Spacing,
  useTheme,
  type ColorTokens,
} from "@/constants/theme";
import { useBlame } from "@/hooks/useBlame";
import { buildBlameLines, type BlameLine } from "@/lib/blame-highlight";
import { decodeRepoId, relativeTime } from "@/lib/utils";
import type { HighlightTheme } from "@tanstack/highlight/theme";
import { Octicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { memo, useCallback, useLayoutEffect, useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

const ROW_HEIGHT = 22;

export default function BlameScreen() {
  return (
    <ErrorBoundary fallback="back">
      <BlameScreenContent />
    </ErrorBoundary>
  );
}

function BlameScreenContent() {
  const { repoId, path, ref, fileName } = useLocalSearchParams<{
    repoId: string;
    path: string;
    ref: string;
    fileName?: string;
  }>();
  const navigation = useNavigation();
  const { colors, syntaxTheme } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const { data, isLoading, isError } = useBlame(owner, repoName, ref ?? "", path ?? "");

  useLayoutEffect(() => {
    navigation.setOptions({ title: fileName ?? "Blame" });
  }, [navigation, fileName]);

  const lines = useMemo(
    () => (data?.text ? buildBlameLines(data.text, data.ranges, fileName ?? path ?? "") : []),
    [data, fileName, path],
  );

  const s = useMemo(() => buildStyles(colors), [colors]);

  if (isLoading) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <Octicons name="alert" size={IconSize.xl} color={colors.danger} />
        <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>Failed to load blame</Text>
      </View>
    );
  }

  if (data.isBinary) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <Octicons name="file-binary" size={IconSize.xl} color={colors.textMuted} />
        <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>
          Binary files can&apos;t be blamed
        </Text>
      </View>
    );
  }

  if (lines.length === 0) {
    return (
      <View style={[s.centered, { backgroundColor: colors.background }]}>
        <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>
          No blame data for this file
        </Text>
      </View>
    );
  }

  return (
    <FlashList
      data={lines}
      keyExtractor={(item) => String(item.lineNumber)}
      renderItem={({ item }) => (
        <BlameLineRow
          line={item}
          colors={colors}
          syntaxTheme={syntaxTheme}
          s={s}
          repoId={repoId ?? ""}
        />
      )}
      drawDistance={400}
      style={{ backgroundColor: colors.background }}
    />
  );
}

const BlameLineRow = memo(function BlameLineRow({
  line,
  colors,
  syntaxTheme,
  s,
  repoId,
}: {
  line: BlameLine;
  colors: ColorTokens;
  syntaxTheme: HighlightTheme;
  s: ReturnType<typeof buildStyles>;
  repoId: string;
}) {
  const handlePress = useCallback(() => {
    router.push({
      pathname: "/(app)/repo/[repoId]/commit/[sha]",
      params: { repoId, sha: line.range.commit.oid },
    });
  }, [repoId, line.range.commit.oid]);

  const tintColor = line.tint === 0 ? colors.surface : colors.background;

  return (
    <Pressable onPress={handlePress} style={[s.row, { backgroundColor: tintColor }]}>
      <View style={s.gutter}>
        {line.isRangeStart && (
          <>
            <Text style={[s.sha, { color: colors.textSecondary }]}>
              {line.range.commit.oid.slice(0, 7)}
            </Text>
            <Text style={[s.date, { color: colors.textMuted }]} numberOfLines={1}>
              {relativeTime(line.range.commit.committedDate)}
            </Text>
          </>
        )}
      </View>
      <Text style={[s.lineNumber, { color: colors.textMuted }]}>{line.lineNumber}</Text>
      <Text style={[s.code, { color: syntaxTheme.foreground }]} numberOfLines={1}>
        {line.nodes.length ? renderSyntaxNodes(line.nodes, syntaxTheme) : " "}
      </Text>
    </Pressable>
  );
});

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.md,
      padding: Spacing.xl,
    },
    emptyTitle: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      textAlign: "center",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      height: ROW_HEIGHT,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    gutter: {
      width: 108,
      flexShrink: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      paddingHorizontal: Spacing.xs,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: colors.border,
    },
    sha: {
      fontFamily: FontFamily.mono,
      fontSize: 10,
    },
    date: {
      flexShrink: 1,
      fontFamily: FontFamily.regular,
      fontSize: 10,
    },
    lineNumber: {
      width: 36,
      flexShrink: 0,
      textAlign: "right",
      paddingRight: Spacing.xs,
      fontFamily: FontFamily.mono,
      fontSize: 11,
    },
    code: {
      flex: 1,
      fontFamily: FontFamily.mono,
      fontSize: 11,
      paddingLeft: Spacing.xs,
    },
  });
}
