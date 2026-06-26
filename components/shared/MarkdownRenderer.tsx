import { useTheme } from "@/constants/theme";
import { githubAxios } from "@/lib/axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { WebViewMessageEvent } from "react-native-webview";
import RNWebView from "react-native-webview";

const WebView = RNWebView as unknown as React.ComponentType<any>;

interface MarkdownRendererProps {
  markdown: string;
  style?: StyleProp<ViewStyle>;
}

function buildHtml(
  html: string,
  colors: Record<string, string>,
  isDark: boolean,
): string {
  const bg = isDark ? "#0D1117" : "#FAF9F6";
  const text = isDark ? "#E6EDF3" : "#1A2332";
  const textSecondary = isDark ? "#8B949E" : "#5A6B7B";
  const border = isDark ? "#30363D" : "#D9D3C7";
  const accent = isDark ? "#58A6FF" : "#3B82F6";
  const codeBg = isDark ? "#161B22" : "#F5F1E8";
  const codeText = isDark ? "#E6EDF3" : "#1A2332";
  const surfaceSecondary = isDark ? "#1C2128" : "#F5F1E8";
  const blockquoteBorder = isDark ? "#30363D" : "#D9D3C7";
  const blockquoteBg = isDark ? "#161B22" : "#F8F6F0";

  const safeHtml = html
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: ${text};
    background: ${bg};
    padding: 16px;
    -webkit-text-size-adjust: 100%;
    word-wrap: break-word;
  }
  .markdown-body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: ${text};
    word-wrap: break-word;
  }
  .markdown-body h1, .markdown-body h2, .markdown-body h3,
  .markdown-body h4, .markdown-body h5, .markdown-body h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
    color: ${text};
  }
  .markdown-body h1 { font-size: 28px; padding-bottom: 0.3em; border-bottom: 1px solid ${border}; }
  .markdown-body h2 { font-size: 22px; padding-bottom: 0.3em; border-bottom: 1px solid ${border}; }
  .markdown-body h3 { font-size: 18px; }
  .markdown-body h4 { font-size: 16px; }
  .markdown-body h5 { font-size: 14px; }
  .markdown-body h6 { font-size: 14px; color: ${textSecondary}; }
  .markdown-body p { margin-top: 0; margin-bottom: 16px; }
  .markdown-body a { color: ${accent}; text-decoration: none; }
  .markdown-body a:hover { text-decoration: underline; }
  .markdown-body strong { font-weight: 600; }
  .markdown-body em { font-style: italic; }
  .markdown-body del { text-decoration: line-through; color: ${textSecondary}; }
  .markdown-body blockquote {
    padding: 0 16px;
    margin: 0 0 16px 0;
    color: ${textSecondary};
    border-left: 4px solid ${blockquoteBorder};
    background: ${blockquoteBg};
    padding: 12px 16px;
    border-radius: 0 6px 6px 0;
  }
  .markdown-body blockquote p:last-child { margin-bottom: 0; }
  .markdown-body ul, .markdown-body ol {
    padding-left: 2em;
    margin-top: 0;
    margin-bottom: 16px;
  }
  .markdown-body li { margin-top: 4px; }
  .markdown-body li + li { margin-top: 4px; }
  .markdown-body code {
    font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
    font-size: 13px;
    background: ${codeBg};
    color: ${codeText};
    padding: 2px 6px;
    border-radius: 4px;
  }
  .markdown-body pre {
    margin-top: 0;
    margin-bottom: 16px;
    padding: 16px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    font-size: 13px;
    line-height: 1.45;
    background: ${codeBg};
    border-radius: 8px;
    border: 1px solid ${border};
  }
  .markdown-body pre code {
    background: transparent;
    padding: 0;
    border-radius: 0;
    font-size: 13px;
    color: ${text};
  }
  .markdown-body table {
    border-collapse: collapse;
    border-spacing: 0;
    width: 100%;
    margin-top: 0;
    margin-bottom: 16px;
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 6px;
    border: 1px solid ${border};
  }
  .markdown-body table th, .markdown-body table td {
    padding: 8px 16px;
    border: 1px solid ${border};
    font-size: 13px;
  }
  .markdown-body table th {
    font-weight: 600;
    background: ${surfaceSecondary};
  }
  .markdown-body table tr:nth-child(2n) {
    background: ${surfaceSecondary};
  }
  .markdown-body hr {
    height: 2px;
    padding: 0;
    margin: 24px 0;
    background-color: ${border};
    border: 0;
  }
  .markdown-body img {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
  }
  .markdown-body details {
    margin-bottom: 16px;
  }
  .markdown-body details summary {
    cursor: pointer;
    font-weight: 600;
    padding: 8px 0;
  }
  .markdown-body .task-list-item {
    list-style-type: none;
    margin-left: -1.5em;
  }
  .markdown-body .task-list-item input[type="checkbox"] {
    margin-right: 8px;
  }
  .markdown-body .anchor {
    float: left;
    padding-right: 4px;
    margin-left: -20px;
    line-height: 1;
    color: ${textSecondary};
    text-decoration: none;
  }
  .markdown-body .anchor:hover {
    text-decoration: none;
  }
  .markdown-body .header-link {
    color: ${textSecondary};
    text-decoration: none;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .markdown-body .header-link:hover {
    text-decoration: none;
  }
  .markdown-body .octicon {
    display: inline-block;
    vertical-align: middle;
  }
</style>
</head>
<body>
<div class="markdown-body">${safeHtml}</div>
<script>
  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: 'height',
    height: document.body.scrollHeight
  }));
</script>
</body>
</html>`;
}

export function MarkdownRenderer({ markdown, style }: MarkdownRendererProps) {
  const { colors, isDark } = useTheme();
  const [html, setHtml] = useState<string | null>(null);
  const [height, setHeight] = useState(300);
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const { data } = await githubAxios.post<string>(
          "/markdown",
          {
            text: markdown,
            mode: "gfm",
          },
          {
            headers: {
              Accept: "application/vnd.github.html+json",
            },
          },
        );

        if (!cancelled) {
          setHtml(
            buildHtml(
              data,
              colors as unknown as Record<string, string>,
              isDark,
            ),
          );
        }
      } catch {
        if (!cancelled) {
          const escaped = markdown
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br>");
          setHtml(
            buildHtml(
              `<pre>${escaped}</pre>`,
              colors as unknown as Record<string, string>,
              isDark,
            ),
          );
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [markdown, isDark]);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "height" && data.height > 0) {
        setHeight(data.height);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  if (!html) {
    return (
      <View style={[s.loading, style]}>
        <View
          style={[s.skeletonLine, { backgroundColor: colors.surfaceSecondary }]}
        />
        <View
          style={[
            s.skeletonLine,
            s.skeletonShort,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        />
        <View
          style={[s.skeletonLine, { backgroundColor: colors.surfaceSecondary }]}
        />
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ html }}
      style={[s.webview, { height }, style]}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      onMessage={onMessage}
      originWhitelist={["*"]}
      javaScriptEnabled
      textEncodingUsage="utf-8"
    />
  );
}

const s = StyleSheet.create({
  loading: {
    gap: 8,
    padding: 16,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 4,
    width: "100%",
  },
  skeletonShort: {
    width: "60%",
  },
  webview: {
    flex: 0,
  },
});
