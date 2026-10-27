import { Octicons } from "@expo/vector-icons";
import type { HighlightTheme } from "@tanstack/highlight/theme";
import { createThemeRule, themeTokenClasses } from "@tanstack/highlight/theme";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import {
  FontFamily,
  FontSize,
  IconSize,
  Radius,
  Spacing,
  useTheme,
  type ColorTokens,
} from "@/constants/theme";
import { highlightFile, type HighlightedFile } from "@/lib/highlight";

import { FileError } from "./FileError";

interface CodeViewerProps {
  content: string;
  fileName: string;
  targetLine?: number;
}

export function CodeViewer({ content, fileName, targetLine }: CodeViewerProps) {
  const { colors, syntaxTheme } = useTheme();
  const s = useMemo(() => buildStyles(colors), [colors]);
  const webViewRef = useRef<WebView>(null);
  const [file, setFile] = useState<HighlightedFile | null>(null);
  const [failed, setFailed] = useState(false);
  const [wrap, setWrap] = useState(true);
  const [copied, setCopied] = useState(false);

  // Highlighting blocks the JS thread, so let the loading state paint first.
  // It runs outside render, where the screen's ErrorBoundary can't catch a
  // throw, so catch it here.
  useEffect(() => {
    setFile(null);
    setFailed(false);
    const id = setTimeout(() => {
      try {
        setFile(highlightFile(content, fileName, targetLine));
      } catch (error) {
        console.error("Highlighting failed", error);
        setFailed(true);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [content, fileName, targetLine]);

  const html = useMemo(
    () => (file ? buildHtml(file, colors, syntaxTheme, targetLine) : null),
    [file, colors, syntaxTheme, targetLine],
  );

  // Toggled in place so the page keeps its scroll position. Also re-sent on
  // load, since a theme change rebuilds the page with wrap on.
  const syncWrap = useCallback((on: boolean) => {
    webViewRef.current?.injectJavaScript(`setWrap(${on}); true;`);
  }, []);

  const toggleWrap = () => {
    setWrap(!wrap);
    syncWrap(!wrap);
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (failed) {
    return <FileError title="Couldn't display this file" />;
  }

  return (
    <View style={s.container}>
      <View style={s.toolbar}>
        <Text style={s.meta} numberOfLines={1}>
          {file
            ? `${file.lineCount.toLocaleString()} ${file.lineCount === 1 ? "line" : "lines"} · ${file.lang}`
            : " "}
        </Text>
        <Pressable
          onPress={toggleWrap}
          hitSlop={8}
          style={[s.pill, wrap && s.pillActive]}
          accessibilityRole="switch"
          accessibilityState={{ checked: wrap }}
          accessibilityLabel="Wrap long lines"
        >
          <Text style={[s.pillText, wrap && s.pillTextActive]}>Wrap</Text>
        </Pressable>
        <Pressable
          onPress={handleCopy}
          hitSlop={8}
          style={s.iconButton}
          accessibilityLabel="Copy file"
        >
          <Octicons
            name={copied ? "check" : "copy"}
            size={IconSize.sm}
            color={copied ? colors.success : colors.textSecondary}
          />
        </Pressable>
      </View>

      {html ? (
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={s.webview}
          originWhitelist={["about:*", "data:*"]}
          onLoadEnd={() => syncWrap(wrap)}
          javaScriptEnabled
        />
      ) : (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}
    </View>
  );
}

function buildHtml(
  file: HighlightedFile,
  colors: ColorTokens,
  syntaxTheme: HighlightTheme,
  targetLine: number | undefined,
): string {
  const gutter = `${String(file.lineCount).length}ch`;
  const tokenRules = themeTokenClasses
    .map((token) => `.th-${token} { color: var(--th-${token}); }`)
    .join("\n");
  const scrollToTarget =
    targetLine !== undefined && Number.isInteger(targetLine)
      ? `var t = document.querySelector('[data-line="${targetLine}"]');
         if (t) t.scrollIntoView({ block: "center" });`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  ${createThemeRule(":root", syntaxTheme)}
  ${tokenRules}
  .th-comment { font-style: italic; }

  html, body { margin: 0; background: ${colors.background}; }
  body { -webkit-text-size-adjust: 100%; }
  pre.th-code {
    margin: 0;
    padding: 8px 0 48px;
    overflow-x: auto;
    background: ${colors.background};
    color: ${colors.textPrimary};
    font: 13px/1.6 'JetBrains Mono', 'SF Mono', monospace;
  }
  /* Drops the newlines between line elements; each .th-line sets its own
     white-space. */
  code { display: block; font: inherit; white-space: normal; }

  /* Line numbers sit in a hanging gutter, so wrapped lines stay indented
     under their own number. */
  .th-line {
    display: block;
    position: relative;
    min-height: 1.6em;
    padding: 0 16px 0 calc(${gutter} + 28px);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .th-line::before {
    content: attr(data-line);
    position: absolute;
    left: 0;
    width: calc(${gutter} + 12px);
    text-align: right;
    color: ${colors.textMuted};
    user-select: none;
    -webkit-user-select: none;
  }
  /* ponytail: with wrap off the gutter scrolls away sideways with the code.
     A sticky gutter needs the numbers in their own column. */
  body.nowrap .th-line {
    white-space: pre;
    overflow-wrap: normal;
    width: max-content;
    min-width: 100%;
    box-sizing: border-box;
  }
  .th-target { background: ${colors.accentSubtle}; }
  .th-target::before { color: ${colors.accent}; }
</style>
</head>
<body>
${file.html}
<script>
  function setWrap(on) {
    if (document.body.classList.contains('nowrap') !== on) return;
    var el = document.elementFromPoint(4, 4);
    var anchor = el && el.closest ? el.closest('.th-line') : null;
    document.body.classList.toggle('nowrap', !on);
    if (anchor) anchor.scrollIntoView();
  }
  ${scrollToTarget}
</script>
</body>
</html>`;
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },

    toolbar: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },

    meta: {
      flex: 1,
      fontFamily: FontFamily.mono,
      fontSize: FontSize.label,
      color: colors.textMuted,
    },

    pill: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },

    pillActive: {
      backgroundColor: colors.accentSubtle,
      borderColor: colors.accentMuted,
    },

    pillText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textSecondary,
    },

    pillTextActive: {
      color: colors.accent,
    },

    iconButton: {
      padding: Spacing.xs,
    },

    webview: {
      flex: 1,
      backgroundColor: colors.background,
    },

    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
