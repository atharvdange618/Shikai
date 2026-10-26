import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Pdf from "react-native-pdf";

import { Spacing, useTheme } from "@/constants/theme";
import { usePdfDataUri } from "@/hooks/usePdfDataUri";

import { FileError } from "./FileError";

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const download = usePdfDataUri(url);
  const [renderError, setRenderError] = useState<string | null>(null);

  if (download.status === "error" || renderError !== null) {
    return (
      <FileError
        title="Failed to load PDF"
        message={
          renderError ?? (download.status === "error" ? download.message : "")
        }
      />
    );
  }

  if (download.status === "loading") {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Pdf
      source={{ uri: download.uri }}
      trustAllCerts={false}
      style={{
        flex: 1,
        width: screenWidth,
        backgroundColor: colors.background,
      }}
      onError={(err) => setRenderError(String(err ?? "unknown error"))}
    />
  );
}

const s = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
    minHeight: 300,
  },
});
