import { Octicons } from "@expo/vector-icons";
import { useCallback, useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import {
  IconSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
  type ColorTokens,
} from "@/constants/theme";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

interface MarkdownViewerProps {
  content: string;
  /** Repo path of the file, for resolving relative links. */
  path: string;
  /** `owner/repo`, for GitHub's markdown rendering context. */
  repoContext: string;
  targetLine?: number;
}

export function MarkdownViewer({
  content,
  path,
  repoContext,
  targetLine,
}: MarkdownViewerProps) {
  const { colors } = useTheme();
  const s = useMemo(() => buildStyles(colors), [colors]);
  const { copied, copy } = useCopyToClipboard();

  const contentScrollRef = useRef<ScrollView>(null);
  const hasScrolledToLineRef = useRef(false);

  const rendererY = useRef(0);
  const handleAnchorOffset = useCallback((y: number) => {
    contentScrollRef.current?.scrollTo({
      y: Math.max(rendererY.current + y - Spacing.md, 0),
      animated: true,
    });
  }, []);

  // Rendered prose doesn't map 1:1 to source lines and GitHub's HTML carries
  // no source positions, so this jumps to the line's proportional position
  // in the WebView's total height. Fires once, on the first height report.
  const handleMarkdownHeightChange = useCallback(
    (height: number) => {
      if (hasScrolledToLineRef.current || !targetLine || targetLine < 1) {
        return;
      }
      const totalLines = content.split("\n").length;
      const fraction = Math.min(Math.max((targetLine - 1) / totalLines, 0), 1);
      const offsetY = Math.max(fraction * height - Spacing.xxl * 2, 0);
      contentScrollRef.current?.scrollTo({ y: offsetY, animated: true });
      hasScrolledToLineRef.current = true;
    },
    [targetLine, content],
  );

  return (
    <ScrollView
      ref={contentScrollRef}
      style={s.contentScroll}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.codeHeader}>
        <Pressable
          style={({ pressed }) => [
            s.copyButton,
            pressed && s.copyButtonPressed,
            copied && s.copyButtonCopied,
          ]}
          onPress={() => copy(content)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Copy file"
        >
          <Octicons
            name={copied ? "check" : "copy"}
            size={IconSize.sm}
            color={copied ? colors.success : colors.textPrimary}
          />
        </Pressable>
      </View>
      <View
        onLayout={(e) => {
          rendererY.current = e.nativeEvent.layout.y;
        }}
      >
        <MarkdownRenderer
          markdown={content}
          context={repoContext}
          filePath={path}
          onHeightChange={handleMarkdownHeightChange}
          onAnchorOffset={handleAnchorOffset}
        />
      </View>
    </ScrollView>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    contentScroll: {
      flex: 1,
    },

    content: {
      padding: Layout.screenPadding,
      paddingBottom: Spacing.xxl,
    },

    codeHeader: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: Spacing.xs,
    },

    copyButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },

    copyButtonPressed: {
      opacity: 0.7,
      backgroundColor: colors.surfaceSecondary,
    },

    copyButtonCopied: {
      backgroundColor: colors.successSubtle,
      borderColor: colors.success,
    },
  });
}
