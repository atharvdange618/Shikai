import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { WebView } from "react-native-webview";

import {
  FontFamily,
  FontSize,
  Radius,
  Spacing,
  useTheme,
  type ColorTokens,
} from "@/constants/theme";
import { buildSvgHtml } from "@/lib/file-html";

import { FileError } from "./FileError";

interface ImageViewerProps {
  url: string;
  isSvg: boolean;
}

export function ImageViewer({ url, isSvg }: ImageViewerProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const s = useMemo(() => buildStyles(colors), [colors]);

  return (
    <ScrollView
      style={s.contentScroll}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.imageWrapper}>
        {imageLoading && !imageError && !isSvg && (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={s.loadingText}>Loading image...</Text>
          </View>
        )}
        {imageError && !isSvg && <FileError title="Failed to load image" />}
        {isSvg ? (
          <WebView
            source={{ html: buildSvgHtml(url, colors.background) }}
            style={{
              width: screenWidth - Spacing.lg * 2,
              height: 400,
              backgroundColor: "transparent",
            }}
            scrollEnabled={false}
            javaScriptEnabled={false}
          />
        ) : (
          !imageError && (
            <Image
              source={{ uri: url }}
              style={[
                s.image,
                {
                  width: screenWidth - Spacing.lg * 2,
                  maxHeight: 600,
                  opacity: imageLoading ? 0 : 1,
                },
              ]}
              resizeMode="contain"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
          )
        )}
      </View>
    </ScrollView>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    contentScroll: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
    },

    imageWrapper: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.lg,
      minHeight: 400,
    },

    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.xl,
      gap: Spacing.md,
      minHeight: 300,
    },

    loadingText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textMuted,
    },

    image: {
      minHeight: 200,
      borderRadius: Radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
}
