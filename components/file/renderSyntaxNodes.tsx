import type { HighlightRenderNode } from "@tanstack/highlight/core";
import type { HighlightTheme, HighlightThemeToken } from "@tanstack/highlight/theme";
import { Text } from "react-native";

export function renderSyntaxNodes(nodes: HighlightRenderNode[], theme: HighlightTheme) {
  return nodes.map((node, i) => {
    if (node.type === "text") return node.value;
    const token = node.classNames.find((c) => c.startsWith("th-") && c !== "th-token")?.slice(3);
    const color =
      token && token in theme.tokens ? theme.tokens[token as HighlightThemeToken] : undefined;
    return (
      <Text key={i} style={color ? { color } : undefined}>
        {renderSyntaxNodes(node.children, theme)}
      </Text>
    );
  });
}
