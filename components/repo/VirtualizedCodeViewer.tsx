import { FlashList } from "@shopify/flash-list";
import { useCallback, useMemo } from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import SyntaxHighlighter from "react-native-syntax-highlighter";
import {
  atomDark,
  ghcolors,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import { FontFamily, FontSize, Spacing } from "@/constants/theme";
import { splitIntoChunks } from "@/lib/file-utils";

interface VirtualizedCodeViewerProps {
  content: string;
  language: string;
  ListHeaderComponent?: React.ReactElement;
}

function ChunkItem({
  chunk,
  language,
  isDark,
}: {
  chunk: string;
  language: string;
  isDark: boolean;
}) {
  return (
    <SyntaxHighlighter
      language={language}
      style={isDark ? atomDark : ghcolors}
      customStyle={{ backgroundColor: "transparent", padding: 0 }}
      PreTag={View}
      CodeTag={Text}
      fontSize={FontSize.body}
      highlighter="prism"
      fontFamily={FontFamily.mono}
    >
      {chunk}
    </SyntaxHighlighter>
  );
}

export function VirtualizedCodeViewer({
  content,
  language,
  ListHeaderComponent,
}: VirtualizedCodeViewerProps) {
  const isDark = useColorScheme() === "dark";

  const chunks = useMemo(() => splitIntoChunks(content), [content]);

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <ChunkItem chunk={item} language={language} isDark={isDark} />
    ),
    [language, isDark],
  );

  return (
    <FlashList
      data={chunks}
      renderItem={renderItem}
      keyExtractor={(_, index) => String(index)}
      removeClippedSubviews
      drawDistance={200}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.listContent}
      ListHeaderComponent={ListHeaderComponent}
    />
  );
}

const s = StyleSheet.create({
  listContent: {
    padding: Spacing.lg,
  },
});
