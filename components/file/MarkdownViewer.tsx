import { Octicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useRef, useState } from "react";
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
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const contentScrollRef = useRef<ScrollView>(null);
  const hasScrolledToLineRef = useRef(false);

  // Exact position: the WebView locates the target line via the Range API
  // against the rendered code block and reports its real pixel offset.
  const handleLineOffset = useCallback((y: number) => {
    if (hasScrolledToLineRef.current) return;
    const offsetY = Math.max(y - Spacing.xxl * 2, 0);
    contentScrollRef.current?.scrollTo({ y: offsetY, animated: true });
    hasScrolledToLineRef.current = true;
  }, []);

  const rendererY = useRef(0);
  const handleAnchorOffset = useCallback((y: number) => {
    contentScrollRef.current?.scrollTo({
      y: Math.max(rendererY.current + y - Spacing.md, 0),
      animated: true,
    });
  }, []);

  // Fallback for markdown files: there's no single code block to locate a
  // source line inside (the rendered prose doesn't map 1:1 to source lines),
  // so this jumps to the line's proportional position in the WebView's total
  // height instead. Only fires if the exact lookup above didn't already.
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
          onPress={handleCopy}
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
          targetLine={targetLine}
          onLineOffset={handleLineOffset}
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
