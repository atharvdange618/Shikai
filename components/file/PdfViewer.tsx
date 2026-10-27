import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Pdf from "react-native-pdf";

import { Spacing, useTheme } from "@/constants/theme";

import { FileError } from "./FileError";

interface PdfViewerProps {
  url: string;
}

type Download =
  | { status: "loading" }
  | { status: "ready"; uri: string }
  | { status: "error"; message: string };

export function PdfViewer({ url }: PdfViewerProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [download, setDownload] = useState<Download>({ status: "loading" });
  const [renderError, setRenderError] = useState<string | null>(null);

  // react-native-pdf downloads a remote URL through react-native-blob-util,
  // which chokes on GitHub's redirect. Fetch the bytes with RN's own stack
  // (straight to GitHub, no third party) and hand the viewer a data URI.
  useEffect(() => {
    let cancelled = false;
    setDownload({ status: "loading" });

    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = String(reader.result);
            const comma = result.indexOf(",");
            resolve(comma === -1 ? result : result.slice(comma + 1));
          };
          reader.onerror = () =>
            reject(reader.error ?? new Error("could not read PDF"));
          reader.readAsDataURL(blob);
        });
        if (!cancelled) {
          setDownload({
            status: "ready",
            uri: `data:application/pdf;base64,${base64}`,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setDownload({
            status: "error",
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

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
