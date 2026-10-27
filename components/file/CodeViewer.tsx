import { Octicons } from "@expo/vector-icons";
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
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { buildCodeHtml } from "@/lib/file-html";
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
  const { copied, copy } = useCopyToClipboard();

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
    () => (file ? buildCodeHtml(file, colors, syntaxTheme, targetLine) : null),
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
          hitSlop={{ top: 12, bottom: 12 }}
          style={[s.pill, wrap && s.pillActive]}
          accessibilityRole="switch"
          accessibilityState={{ checked: wrap }}
          accessibilityLabel="Wrap long lines"
        >
          <Text style={[s.pillText, wrap && s.pillTextActive]}>Wrap</Text>
        </Pressable>
        <Pressable
          onPress={() => copy(content)}
          style={s.iconButton}
          accessibilityRole="button"
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

    // 48dp touch target; the negative margin keeps the toolbar's height.
    iconButton: {
      minWidth: 48,
      minHeight: 48,
      marginVertical: -Spacing.md,
      alignItems: "center",
      justifyContent: "center",
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
