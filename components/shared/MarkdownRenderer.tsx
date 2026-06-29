import { useTheme } from "@/constants/theme";
import { githubAxios } from "@/lib/axios";
import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { WebViewMessageEvent } from "react-native-webview";
import RNWebView from "react-native-webview";

const WebView = RNWebView as unknown as React.ComponentType<any>;

interface MarkdownRendererProps {
  markdown: string;
  style?: StyleProp<ViewStyle>;
  context?: string;
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

function buildHtml(html: string, isDark: boolean): string {
  const bg = isDark ? "#0D1117" : "#FAF9F6";
  const text = isDark ? "#E6EDF3" : "#1A2332";
  const textSecondary = isDark ? "#8B949E" : "#5A6B7B";
  const border = isDark ? "#30363D" : "#D9D3C7";
  const accent = isDark ? "#58A6FF" : "#3B82F6";
  const codeBg = isDark ? "#161B22" : "#F0EDE6";

  const surfaceSecondary = isDark ? "#1C2128" : "#F5F1E8";
  const blockquoteBg = isDark ? "#161B22" : "#F8F6F0";
  const codeHeaderBg = isDark ? "#1C2128" : "#E8E4DC";
  const copyBtnColor = isDark ? "#768390" : "#8B949E";
  const copiedColor = isDark ? "#8DDB8C" : "#22863a";
  const checkColor = isDark ? "#8DDB8C" : "#22863a";

  const plKw = isDark ? "#F47067" : "#d73a49";
  const plC = isDark ? "#768390" : "#6a737d";
  const plS = isDark ? "#96D0FF" : "#032f62";
  const plE = isDark ? "#F69D50" : "#e36209";
  const plEn = isDark ? "#6CB6FF" : "#005cc5";
  const plV = isDark ? "#ADBAC7" : "#24292e";
  const plMs = isDark ? "#8DDB8C" : "#22863a";
  const plMh = isDark ? "#6CB6FF" : "#005cc5";
  const plMl = isDark ? "#96D0FF" : "#032f62";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: ${text};
    background: ${bg};
    padding: 16px;
    -webkit-text-size-adjust: 100%;
    word-wrap: break-word;
  }
  .markdown-body {
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: ${text};
    word-wrap: break-word;
  }
  .markdown-body h1, .markdown-body h2, .markdown-body h3,
  .markdown-body h4, .markdown-body h5, .markdown-body h6 {
    margin-top: 24px; margin-bottom: 16px;
    font-weight: 600; line-height: 1.25; color: ${text};
  }
  .markdown-body h1 { font-size: 26px; padding-bottom: 0.3em; border-bottom: 1px solid ${border}; }
  .markdown-body h2 { font-size: 21px; padding-bottom: 0.3em; border-bottom: 1px solid ${border}; }
  .markdown-body h3 { font-size: 17px; }
  .markdown-body h4 { font-size: 15px; }
  .markdown-body h5, .markdown-body h6 { font-size: 13px; color: ${textSecondary}; }
  .markdown-body p { margin-top: 0; margin-bottom: 14px; }
  .markdown-body a { color: ${accent}; text-decoration: none; }
  .markdown-body strong { font-weight: 600; }
  .markdown-body em { font-style: italic; }
  .markdown-body del { text-decoration: line-through; color: ${textSecondary}; }
  .markdown-body blockquote {
    padding: 10px 14px; margin: 0 0 14px 0;
    color: ${textSecondary}; border-left: 3px solid ${accent};
    background: ${blockquoteBg}; border-radius: 0 6px 6px 0;
  }
  .markdown-body blockquote p:last-child { margin-bottom: 0; }
  .markdown-body ul, .markdown-body ol { padding-left: 2em; margin: 0 0 14px 0; }
  .markdown-body li { margin-top: 4px; }
  .markdown-body li + li { margin-top: 4px; }

  .markdown-body :not(pre) > code {
    font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
    font-size: 12.5px;
    background: ${codeBg};
    color: ${plKw};
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid ${border};
  }

  .code-block-wrapper {
    margin-bottom: 16px;
    border-radius: 10px;
    border: 1px solid ${border};
    overflow: hidden;
    background: ${codeBg};
  }
  .code-block-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 14px;
    background: ${codeHeaderBg};
    border-bottom: 1px solid ${border};
    min-height: 36px;
  }
  .code-block-lang {
    font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
    font-size: 10.5px;
    font-weight: 600;
    color: ${textSecondary};
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .copy-btn {
    display: flex; align-items: center; gap: 4px;
    background: none; border: 1px solid ${border}; border-radius: 5px;
    padding: 3px 9px; cursor: pointer;
    font-size: 11px; font-family: -apple-system, sans-serif;
    color: ${copyBtnColor};
    transition: color 0.15s, border-color 0.15s;
    outline: none; -webkit-tap-highlight-color: transparent;
  }
  .copy-btn.copied { color: ${copiedColor}; border-color: ${copiedColor}; }

  .mermaid-wrapper {
    margin-bottom: 16px;
    padding: 20px 12px;
    border-radius: 10px;
    border: 1px solid ${border};
    background: ${codeBg};
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    display: flex;
    justify-content: center;
  }
  .mermaid-wrapper svg {
    max-width: 100%;
    height: auto;
  }
  .mermaid-error {
    margin-bottom: 16px;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid ${isDark ? "#F47067" : "#d73a49"};
    background: ${isDark ? "rgba(244,112,103,0.08)" : "rgba(215,58,73,0.06)"};
    font-family: 'JetBrains Mono', 'SF Mono', monospace;
    font-size: 12px;
    color: ${isDark ? "#F47067" : "#d73a49"};
  }

  .markdown-body .highlight,
  .markdown-body pre {
    margin: 0;
    padding: 14px 16px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    font-size: 13px; line-height: 1.65;
    background: ${codeBg};
    font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  }
  .markdown-body > pre {
    border-radius: 10px; border: 1px solid ${border}; margin-bottom: 16px;
  }
  .markdown-body .highlight pre,
  .markdown-body pre > pre {
    margin: 0; padding: 0; border: none; background: transparent; border-radius: 0;
  }
  .markdown-body pre code,
  .markdown-body .highlight code {
    background: transparent; padding: 0; border: none;
    border-radius: 0; font-size: 13px; color: ${text};
    font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  }


  .pl-kos, .pl-c1, .pl-c2 { color: ${plE}; }
  .pl-k, .pl-s1 .pl-kos { color: ${plKw}; }
  .pl-c  { color: ${plC}; font-style: italic; }
  .pl-s, .pl-s1, .pl-pds { color: ${plS}; }
  .pl-pse .pl-s1 { color: ${plS}; }
  .pl-e, .pl-en, .pl-enm { color: ${plEn}; }
  .pl-ent { color: ${plMs}; }
  .pl-v, .pl-smi { color: ${plV}; }
  .pl-bu  { color: ${plKw}; }
  .pl-mdr { color: ${plE}; font-weight: bold; }
  .pl-mi  { color: ${plKw}; font-style: italic; }
  .pl-mb  { color: ${text}; font-weight: bold; }
  .pl-ms  { color: ${plMs}; }
  .pl-mh  { color: ${plMh}; font-weight: bold; }
  .pl-mi1 { color: ${plMs}; }
  .pl-md  { color: ${plKw}; }
  .pl-ml  { color: ${plMl}; }
  .pl-mq  { color: ${plE}; }
  .pl-sr  { color: ${plMs}; }
  .pl-id, .pl-ii { color: ${plKw}; }

  .markdown-body table {
    border-collapse: collapse; width: 100%; margin: 0 0 16px 0;
    display: block; overflow-x: auto; -webkit-overflow-scrolling: touch;
    border-radius: 6px; border: 1px solid ${border};
  }
  .markdown-body table th, .markdown-body table td {
    padding: 8px 14px; border: 1px solid ${border}; font-size: 13px;
  }
  .markdown-body table th { font-weight: 600; background: ${surfaceSecondary}; }
  .markdown-body table tr:nth-child(2n) { background: ${surfaceSecondary}; }
  .markdown-body hr { height: 2px; margin: 24px 0; background: ${border}; border: 0; }
  .markdown-body img { max-width: 100%; height: auto; border-radius: 6px; }
  .markdown-body details { margin-bottom: 14px; }
  .markdown-body details summary { cursor: pointer; font-weight: 600; padding: 6px 0; }
  .markdown-body .task-list-item { list-style: none; margin-left: -1.5em; }
  .markdown-body .task-list-item input[type="checkbox"] { margin-right: 8px; }
  .markdown-body .anchor { float: left; padding-right: 4px; margin-left: -20px; line-height: 1; color: ${textSecondary}; text-decoration: none; }
  .markdown-body .octicon { display: inline-block; vertical-align: middle; }
</style>
</head>
<body>
<div class="markdown-body">${html}</div>
<script>
  var LANG_LABELS = {
    javascript:'JavaScript',typescript:'TypeScript',js:'JavaScript',ts:'TypeScript',
    python:'Python',py:'Python',ruby:'Ruby',go:'Go',rust:'Rust',java:'Java',
    kotlin:'Kotlin',swift:'Swift',c:'C',cpp:'C++',csharp:'C#',cs:'C#',
    css:'CSS',scss:'SCSS',html:'HTML',xml:'XML',json:'JSON',yaml:'YAML',
    yml:'YAML',bash:'Bash',sh:'Shell',shell:'Shell',sql:'SQL',lua:'Lua',
    dart:'Dart',diff:'Diff',ini:'INI',toml:'TOML',makefile:'Makefile',
    markdown:'Markdown',md:'Markdown',plaintext:'Plain Text',text:'Plain Text',
    r:'R',php:'PHP',perl:'Perl',scala:'Scala',elixir:'Elixir',haskell:'Haskell',
    objc:'Objective-C',tf:'Terraform',groovy:'Groovy',powershell:'PowerShell',
  };

  var ICON_COPY = '<svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" style="flex-shrink:0"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>';
  var ICON_CHECK = '<svg width="11" height="11" viewBox="0 0 16 16" fill="${checkColor}" style="flex-shrink:0"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>';

  function extractLang(el) {
    var cls = Array.from(el.classList).find(function(c){ return c.startsWith('highlight-source-'); });
    if (!cls) return '';
    var raw = cls.replace('highlight-source-','').replace(/-/g,'');
    return LANG_LABELS[raw] || LANG_LABELS[cls.replace('highlight-source-','')] || cls.replace('highlight-source-','').toUpperCase();
  }


  function makeCopyBtn(getText) {
    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.innerHTML = ICON_COPY + '<span>Copy</span>';
    btn.addEventListener('click', function() {
      var text = getText();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'copy', text: text }));
      }
      btn.classList.add('copied');
      btn.innerHTML = ICON_CHECK + '<span>Copied!</span>';
      setTimeout(function() {
        btn.classList.remove('copied');
        btn.innerHTML = ICON_COPY + '<span>Copy</span>';
      }, 2000);
    });
    return btn;
  }

  function wrapBlock(hl, lang, getText) {
    var wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';

    var header = document.createElement('div');
    header.className = 'code-block-header';

    var langEl = document.createElement('span');
    langEl.className = 'code-block-lang';
    langEl.textContent = lang;

    header.appendChild(langEl);
    header.appendChild(makeCopyBtn(getText));
    wrapper.appendChild(header);

    hl.parentNode.insertBefore(wrapper, hl);
    wrapper.appendChild(hl);
  }

  function isMermaid(el) {
    return Array.from(el.classList).some(function(c) { return c === 'highlight-source-mermaid'; });
  }

  function renderMermaid(blocks) {
    if (blocks.length === 0) return;
    var isDark = ${isDark ? "true" : "false"};
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
    script.onload = function() {
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
        fontSize: 14,
      });
      var pending = blocks.length;
      blocks.forEach(function(item, i) {
        var id = 'mermaid-diagram-' + i + '-' + Date.now();
        mermaid.render(id, item.source)
          .then(function(result) {
            var wrapper = document.createElement('div');
            wrapper.className = 'mermaid-wrapper';
            wrapper.innerHTML = result.svg;
            item.el.parentNode.replaceChild(wrapper, item.el);
          })
          .catch(function() {
            var err = document.createElement('div');
            err.className = 'mermaid-error';
            err.textContent = 'Mermaid diagram failed to render';
            item.el.parentNode.replaceChild(err, item.el);
          })
          .finally(function() {
            pending--;
            if (pending === 0) { postHeight(); setTimeout(postHeight, 150); }
          });
      });
    };
    script.onerror = function() {
      blocks.forEach(function(item) {
        var err = document.createElement('div');
        err.className = 'mermaid-error';
        err.textContent = 'Could not load Mermaid renderer';
        item.el.parentNode.replaceChild(err, item.el);
      });
    };
    document.head.appendChild(script);
  }

  function init() {
    var mermaidBlocks = [];

    document.querySelectorAll('.markdown-body .highlight[class*="highlight-source"]').forEach(function(hl) {
      if (isMermaid(hl)) {
        var pre = hl.querySelector('pre');
        mermaidBlocks.push({ el: hl, source: pre ? (pre.innerText || pre.textContent) : '' });
        return;
      }
      var lang = extractLang(hl);
      var pre = hl.querySelector('pre');
      wrapBlock(hl, lang, function() { return pre ? pre.innerText : hl.innerText; });
    });

    document.querySelectorAll('.markdown-body pre').forEach(function(pre) {
      if (pre.closest('.code-block-wrapper') || pre.closest('.highlight')) return;
      var code = pre.querySelector('code');
      var rawLang = code ? (code.className.match(/language-([\w+]+)/) || [])[1] || '' : '';
      if (rawLang === 'mermaid') {
        mermaidBlocks.push({ el: pre, source: code ? (code.innerText || code.textContent) : '' });
        return;
      }
      var label = LANG_LABELS[rawLang] || rawLang.toUpperCase();
      wrapBlock(pre, label, function() { return pre.innerText; });
    });

    renderMermaid(mermaidBlocks);
  }

  function postHeight() {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'height',
        height: document.body.scrollHeight
      }));
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    init();
    postHeight();
    setTimeout(postHeight, 80);
  });
  window.addEventListener('load', postHeight);
</script>
</body>
</html>`;
}

export function MarkdownRenderer({
  markdown,
  style,
  context,
}: MarkdownRendererProps) {
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
            ...(context ? { context } : {}),
          },
          {
            headers: {
              Accept: "application/vnd.github.html+json",
            },
          },
        );

        if (!cancelled) {
          setHtml(buildHtml(resolveImageUrls(data, context), isDark));
        }
      } catch {
        if (!cancelled) {
          const escaped = markdown
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br>");
          setHtml(buildHtml(`<pre>${escaped}</pre>`, isDark));
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [markdown, isDark, context]);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "height" && data.height > 0) {
        setHeight(data.height);
      } else if (data.type === "copy" && typeof data.text === "string") {
        Clipboard.setStringAsync(data.text).catch(() => {});
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
