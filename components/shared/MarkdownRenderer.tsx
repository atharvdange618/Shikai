import { useTheme } from "@/constants/theme";
import { githubAxios } from "@/lib/axios";
import { parseGitHubUrl } from "@/lib/github-url";
import { buildHtml } from "@/lib/markdown-html";
import { resolveMarkdownLink } from "@/lib/markdown-links";
import * as Clipboard from "expo-clipboard";
import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Animated, Linking, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { WebViewMessageEvent } from "react-native-webview";
import RNWebView from "react-native-webview";

const WebView = RNWebView as unknown as React.ComponentType<any>;

interface MarkdownRendererProps {
  markdown: string;
  style?: StyleProp<ViewStyle>;
  context?: string;
  onHeightChange?: (height: number) => void;
  /**
   * Repo path of the file being shown (README.md, docs/GUIDE.md). Renders in
   * document mode, which gives headings the ids that #links point at, and
   * resolves relative links from this file's folder. Leave unset for issue,
   * PR and comment bodies, which need gfm mode's #123 and @mention linking.
   */
  filePath?: string;
  /** A #link was tapped; y is the target's offset from the WebView's top. */
  onAnchorOffset?: (y: number) => void;
  /**
   * Padding around the rendered content, in px. Defaults to 16. Pass 0 to
   * align the content with a sibling (a comment's author row, say).
   */
  bodyPadding?: number;
}

function resolveImageUrls(html: string, context?: string): string {
  if (!context) return html;
  const [owner, repo] = context.split("/");
  if (!owner || !repo) return html;
  const base = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/`;
  return html.replace(
    /<img\s+([^>]*?)src=["']((?!https?:\/\/)[^"']+)["']/gi,
    (_match, attrs, src) => {
      const resolved = src.startsWith("/") ? src.slice(1) : src;
      return `<img ${attrs}src="${base}${resolved}"`;
    },
  );
}

export function MarkdownRenderer({
  markdown,
  style,
  context,
  onHeightChange,
  filePath,
  onAnchorOffset,
  bodyPadding = 16,
}: MarkdownRendererProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [html, setHtml] = useState<string | null>(null);
  const [height, setHeight] = useState(300);
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const { data } = await githubAxios.post<string>(
          "/markdown",
          {
            text: markdown,
            mode: filePath ? "markdown" : "gfm",
            ...(context ? { context } : {}),
          },
          {
            headers: {
              Accept: "application/vnd.github.html+json",
            },
          },
        );

        if (!cancelled) {
          setHtml(buildHtml(resolveImageUrls(data, context), isDark, bodyPadding));
        }
      } catch {
        if (!cancelled) {
          const escaped = markdown
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br>");
          setHtml(buildHtml(`<pre>${escaped}</pre>`, isDark, bodyPadding));
        }
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [markdown, isDark, context, filePath, bodyPadding]);

  // Hide the WebView until its content has painted and reported a height. A new
  // html string means a reload, so drop back to hidden and wait for that one.
  useEffect(() => {
    opacity.setValue(0);
  }, [html, opacity]);

  const reveal = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  // GitHub's /markdown output is sanitized, but a tapped link would still
  // navigate this WebView in place, with no browser chrome. Send http(s)
  // links to the system browser and let everything else (about:blank, the
  // data: document, the bridge) load.
  const onShouldStartLoad = useCallback((request: { url: string }) => {
    const { url } = request;
    if (/^https?:\/\//i.test(url)) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    return true;
  }, []);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "height" && data.height > 0) {
          setHeight(data.height);
          onHeightChange?.(data.height);
          reveal();
        } else if (data.type === "anchor" && typeof data.y === "number") {
          onAnchorOffset?.(data.y);
        } else if (data.type === "link" && typeof data.href === "string") {
          const url = resolveMarkdownLink(data.href, context, filePath);
          if (!url) return;
          const route = parseGitHubUrl(url);
          if (route) router.push(route as Href);
          else Linking.openURL(url).catch(() => {});
        } else if (data.type === "copy" && typeof data.text === "string") {
          Clipboard.setStringAsync(data.text).catch(() => {});
        }
      } catch {
        // ignore parse errors
      }
    },
    [reveal, onHeightChange, onAnchorOffset, context, filePath, router],
  );

  if (!html) {
    return (
      <View style={[s.loading, { padding: bodyPadding }, style]}>
        <View style={[s.skeletonLine, { backgroundColor: colors.surfaceSecondary }]} />
        <View
          style={[s.skeletonLine, s.skeletonShort, { backgroundColor: colors.surfaceSecondary }]}
        />
        <View style={[s.skeletonLine, { backgroundColor: colors.surfaceSecondary }]} />
      </View>
    );
  }

  return (
    <Animated.View style={[{ opacity }, style]}>
      <WebView
        source={{ html }}
        style={[s.webview, { height }]}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onMessage={onMessage}
        onLoadEnd={reveal}
        onShouldStartLoadWithRequest={onShouldStartLoad}
        originWhitelist={["about:*", "data:*"]}
        javaScriptEnabled
        textEncodingUsage="utf-8"
      />
    </Animated.View>
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
    backgroundColor: "transparent",
  },
});
