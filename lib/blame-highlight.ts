export type TokenKind = "comment" | "string" | "number" | "keyword" | "plain";

export interface Token {
  text: string;
  kind: TokenKind;
}

// One shared, language-agnostic tokenizer for comments/strings/numbers/
// keywords, reused across C-like, Python, and similar languages instead of
// a per-language grammar. Approximate and per-line only: no cross-line block
// comments or strings.
// ponytail: regex approximation across languages, add per-language grammars if people ask
const TOKEN_RE =
  /(\/\/.*|#.*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(\b(?:if|else|elif|for|foreach|while|do|return|function|func|fn|def|class|struct|interface|enum|type|const|let|var|public|private|protected|static|void|null|nil|none|undefined|true|false|self|this|new|import|export|from|as|try|catch|except|finally|throw|raise|switch|case|default|break|continue|async|await|yield|match|package|namespace|extends|implements|super|in|of|instanceof|typeof)\b)/g;

export function tokenizeLine(text: string): Token[] {
  if (!text) return [];

  const tokens: Token[] = [];
  let lastIndex = 0;
  TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: text.slice(lastIndex, match.index), kind: "plain" });
    }
    const kind: TokenKind = match[1]
      ? "comment"
      : match[2]
        ? "string"
        : match[3]
          ? "number"
          : "keyword";
    tokens.push({ text: match[0], kind });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ text: text.slice(lastIndex), kind: "plain" });
  }

  return tokens;
}

// Matches MarkdownRenderer's pl-k / pl-c / pl-s / pl-kos colors so blame and
// the file viewer read as the same highlighting.
export function tokenColor(kind: TokenKind, isDark: boolean): string | undefined {
  switch (kind) {
    case "keyword":
      return isDark ? "#F47067" : "#d73a49";
    case "comment":
      return isDark ? "#768390" : "#6a737d";
    case "string":
      return isDark ? "#96D0FF" : "#032f62";
    case "number":
      return isDark ? "#F69D50" : "#e36209";
    default:
      return undefined;
  }
}
