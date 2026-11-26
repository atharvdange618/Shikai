import { useTheme } from "@/constants/theme";
import { githubAxios } from "@/lib/axios";
import { parseGitHubUrl } from "@/lib/github-url";
import { buildHtml } from "@/lib/markdown-html";
import { buildMarkdownFallback, renderMermaidBlocks } from "@/lib/markdown-mermaid";
import { resolveMarkdownLink } from "@/lib/markdown-links";
import * as Clipboard from "expo-clipboard";
import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Animated, Linking, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

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
  gitRef?: string;
  /** A #link was tapped; y is the target's offset from the WebView's top. */
  onAnchorOffset?: (y: number) => void;
  /**
   * Padding around the rendered content, in px. Defaults to 16. Pass 0 to
   * align the content with a sibling (a comment's author row, say).
   */
  bodyPadding?: number;
}

interface GitHubMarkdown {
  markdown: string;
  context: string | undefined;
  filePath: string | undefined;
  html: string;
}

function resolveImageUrls(html: string, context?: string, gitRef = "HEAD"): string {
  if (!context) return html;
  const [owner, repo] = context.split("/");
  if (!owner || !repo) return html;
  const base = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(gitRef)}/`;
  return html.replace(
    /<img\s+([^>]*?)src=["']((?!https?:\/\/)[^"']+)["']/gi,
    (_match, attrs: string, src: string) => {
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
  gitRef,
  onAnchorOffset,
  bodyPadding = 16,
}: MarkdownRendererProps) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [githubMarkdown, setGitHubMarkdown] = useState<GitHubMarkdown>();
  const [height, setHeight] = useState(300);
  const [opacity] = useState(() => new Animated.Value(0));
  const mermaidSvgs = useMemo(() => renderMermaidBlocks(markdown), [markdown]);
  const githubHtml =
    githubMarkdown?.markdown === markdown &&
    githubMarkdown.context === context &&
    githubMarkdown.filePath === filePath
      ? githubMarkdown.html
      : undefined;
  const html = useMemo(() => {
    const body =
      githubHtml === undefined
        ? buildMarkdownFallback(markdown)
        : resolveImageUrls(githubHtml, context, gitRef);
    return buildHtml(body, isDark, bodyPadding, mermaidSvgs);
  }, [githubHtml, markdown, context, gitRef, isDark, bodyPadding, mermaidSvgs]);

  useEffect(() => {
    let cancelled = false;

    async function loadGitHubMarkdown() {
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

        if (!cancelled) setGitHubMarkdown({ markdown, context, filePath, html: data });
      } catch {}
    }

    void loadGitHubMarkdown();
    return () => {
      cancelled = true;
    };
  }, [markdown, context, filePath]);

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
        const data: unknown = JSON.parse(event.nativeEvent.data);
        if (typeof data !== "object" || data === null || !("type" in data)) return;

        if (
          data.type === "height" &&
          "height" in data &&
          typeof data.height === "number" &&
          data.height > 0
        ) {
          setHeight(data.height);
          onHeightChange?.(data.height);
          reveal();
        } else if (data.type === "anchor" && "y" in data && typeof data.y === "number") {
          onAnchorOffset?.(data.y);
        } else if (data.type === "link" && "href" in data && typeof data.href === "string") {
          const url = resolveMarkdownLink(data.href, context, filePath, gitRef);
          if (!url) return;
          const route = parseGitHubUrl(url);
          if (route) router.push(route as Href);
          else Linking.openURL(url).catch(() => {});
        } else if (data.type === "copy" && "text" in data && typeof data.text === "string") {
          Clipboard.setStringAsync(data.text).catch(() => {});
        }
      } catch {}
    },
    [reveal, onHeightChange, onAnchorOffset, context, filePath, gitRef, router],
  );

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
      />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  webview: {
    flex: 0,
    backgroundColor: "transparent",
  },
});
