import { Octicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VideoView, useVideoPlayer } from "expo-video";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Pdf from "react-native-pdf";
import { WebView } from "react-native-webview";

import { ErrorBoundary } from "@/components";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import {
  FontFamily,
  FontSize,
  IconSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
  type ColorTokens,
} from "@/constants/theme";
import { useFileContent, useRepo } from "@/hooks/useRepoDetails";
import { decodeRepoId, getLanguage, isImageFile, isVideoFile } from "@/lib/utils";

interface LoadingProgressProps {
  isLoading: boolean;
  fileName: string;
  colors: ColorTokens;
}

function LoadingProgress({
  isLoading,
  fileName,
  colors,
}: LoadingProgressProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const [displayProgress, setDisplayProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    if (isLoading) {
      setVisible(true);
      animatedProgress.setValue(0);
      animation = Animated.sequence([
        Animated.timing(animatedProgress, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(animatedProgress, {
          toValue: 0.8,
          duration: 3200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(animatedProgress, {
          toValue: 0.98,
          duration: 20000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]);
      animation.start();
    } else {
      animation = Animated.timing(animatedProgress, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      });
      animation.start(({ finished }) => {
        if (finished) {
          setTimeout(() => setVisible(false), 200);
        }
      });
    }

    const listenerId = animatedProgress.addListener(({ value }) => {
      setDisplayProgress(Math.round(value * 100));
    });

    return () => {
      animation?.stop();
      animatedProgress.removeListener(listenerId);
    };
  }, [isLoading, animatedProgress]);

  const s = useMemo(() => buildStyles(colors), [colors]);

  if (!visible) return null;

  return (
    <View style={s.centered}>
      <View style={s.progressContainer}>
        <View style={s.progressTrack}>
          <Animated.View
            style={[
              s.progressFill,
              {
                width: animatedProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text style={s.loadingText}>{displayProgress}%</Text>
      </View>
      <Text style={s.loadingText}>{`Loading ${fileName}...`}</Text>
    </View>
  );
}

export default function FileViewerScreen() {
  return (
    <ErrorBoundary fallback="back">
      <FileViewerScreenContent />
    </ErrorBoundary>
  );
}

function FileViewerScreenContent() {
  const { repoId, path, fileName, line } = useLocalSearchParams<{
    repoId: string;
    path: string;
    fileName: string;
    line?: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const { data: repo } = useRepo(owner, repoName);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isImage = useMemo(
    () => (fileName ? isImageFile(fileName) : false),
    [fileName],
  );

  const isVideo = useMemo(
    () => (fileName ? isVideoFile(fileName) : false),
    [fileName],
  );

  const isSvg = useMemo(
    () => fileName?.toLowerCase().endsWith(".svg") ?? false,
    [fileName],
  );

  const isPdf = useMemo(
    () => fileName?.toLowerCase().endsWith(".pdf") ?? false,
    [fileName],
  );

  const isMarkdown = useMemo(() => {
    if (!fileName) return false;
    const lower = fileName.toLowerCase();
    return (
      lower.endsWith(".md") ||
      lower.endsWith(".mdx") ||
      lower.endsWith(".markdown")
    );
  }, [fileName]);

  const canBlame = !isImage && !isVideo && !isPdf;

  useEffect(() => {
    if (fileName) {
      try {
        navigation.setOptions({
          title: fileName,
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {canBlame && (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/repo/[repoId]/blame",
                      params: {
                        repoId: repoId ?? "",
                        path: path ?? "",
                        ref: repo?.default_branch ?? "HEAD",
                        fileName,
                      },
                    })
                  }
                  hitSlop={8}
                  style={{ paddingHorizontal: Spacing.sm }}
                >
                  <Octicons name="feed-person" size={20} color={colors.accent} />
                </Pressable>
              )}
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(app)/repo/[repoId]/commits",
                    params: {
                      repoId: repoId ?? "",
                      path: path ?? "",
                      fileName,
                    },
                  })
                }
                hitSlop={8}
                style={{ paddingHorizontal: Spacing.sm }}
              >
                <Octicons name="history" size={20} color={colors.accent} />
              </Pressable>
            </View>
          ),
        });
      } catch {
        /* navigator not ready yet */
      }
    }
  }, [
    navigation,
    router,
    fileName,
    repoId,
    path,
    colors.accent,
    canBlame,
    repo?.default_branch,
  ]);

  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
    setPdfError(null);
    setPdfDataUri(null);
  }, [path]);

  const { data, isLoading, isError, error } = useFileContent(
    owner,
    repoName,
    path ?? "",
    true,
  );

  const pdfDownloadUrl = isPdf ? (data?.meta.download_url ?? null) : null;

  // react-native-pdf downloads a remote URL through react-native-blob-util,
  // which chokes on GitHub's redirect. Fetch the bytes with RN's own stack
  // (straight to GitHub, no third party) and hand the viewer a data URI.
  useEffect(() => {
    if (!pdfDownloadUrl) return;
    let cancelled = false;
    setPdfDataUri(null);
    setPdfError(null);

    (async () => {
      try {
        const res = await fetch(pdfDownloadUrl);
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
          setPdfDataUri(`data:application/pdf;base64,${base64}`);
        }
      } catch (e) {
        if (!cancelled) {
          setPdfError(e instanceof Error ? e.message : String(e));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfDownloadUrl]);

  const handleCopy = useCallback(async () => {
    if (!data?.content) return;
    await Clipboard.setStringAsync(data.content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data?.content]);

  const targetLine = line ? Number(line) : undefined;
  const contentScrollRef = useRef<ScrollView>(null);
  const hasScrolledToLineRef = useRef(false);

  // A shared #L10 link only tells us the line number, not a pixel position,
  // and the rendered HTML has no per-line anchors to measure. So this jumps
  // to the line's proportional position in the WebView's reported total
  // height rather than its exact one — close enough to land the target line
  // on screen. Runs once per file open.
  const handleMarkdownHeightChange = useCallback(
    (height: number) => {
      if (
        hasScrolledToLineRef.current ||
        !targetLine ||
        targetLine < 1 ||
        !data?.content
      ) {
        return;
      }
      const totalLines = data.content.split("\n").length;
      const fraction = Math.min(Math.max((targetLine - 1) / totalLines, 0), 1);
      const offsetY = Math.max(fraction * height - Spacing.xxl * 2, 0);
      contentScrollRef.current?.scrollTo({ y: offsetY, animated: true });
      hasScrolledToLineRef.current = true;
    },
    [targetLine, data?.content],
  );

  const s = useMemo(() => buildStyles(colors), [colors]);

  const showContent = data && !isLoading && !isError;

  const videoPlayer = useVideoPlayer(
    showContent && isVideo && data?.meta.download_url
      ? { uri: data.meta.download_url }
      : null,
  );

  return (
    <SafeAreaView style={s.container} edges={["bottom"]}>
      {isImage && (
        <ScrollView
          style={s.contentScroll}
          contentContainerStyle={s.scrollContentImage}
          showsVerticalScrollIndicator={false}
        >
          <LoadingProgress
            isLoading={isLoading}
            fileName={fileName ?? ""}
            colors={colors}
          />

          {isError && (
            <View style={s.centered}>
              <Octicons name="alert" size={IconSize.lg} color={colors.danger} />
              <Text style={s.errorText}>Failed to load file</Text>
              <Text style={s.errorSubtext}>{(error as Error)?.message}</Text>
            </View>
          )}

          {showContent && (
            <View style={s.imageWrapper}>
              {(imageLoading || imageError) && !isSvg && (
                <View style={s.centered}>
                  {imageLoading && (
                    <>
                      <ActivityIndicator size="large" color={colors.accent} />
                      <Text style={s.loadingText}>Loading image...</Text>
                    </>
                  )}
                  {imageError && (
                    <>
                      <Octicons
                        name="alert"
                        size={IconSize.lg}
                        color={colors.danger}
                      />
                      <Text style={s.errorText}>Failed to load image</Text>
                    </>
                  )}
                </View>
              )}
              {data?.meta.download_url &&
                (isSvg ? (
                  <WebView
                    source={{
                      html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                          <style>
                            body {
                              margin: 0;
                              padding: 16px;
                              display: flex;
                              justify-content: center;
                              align-items: center;
                              min-height: 100vh;
                              background-color: ${colors.background};
                            }
                            img {
                              max-width: 100%;
                              max-height: 90vh;
                              object-fit: contain;
                            }
                          </style>
                        </head>
                        <body>
                          <img src="${data.meta.download_url}" />
                        </body>
                        </html>
                      `,
                    }}
                    style={{
                      width: screenWidth - Spacing.lg * 2,
                      height: 400,
                      backgroundColor: "transparent",
                    }}
                    scrollEnabled={false}
                  />
                ) : (
                  !imageError && (
                    <Image
                      source={{ uri: data.meta.download_url }}
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
                ))}
            </View>
          )}
        </ScrollView>
      )}

      {!isImage && isVideo && (
        <ScrollView
          style={s.contentScroll}
          contentContainerStyle={s.scrollContentImage}
          showsVerticalScrollIndicator={false}
        >
          <LoadingProgress
            isLoading={isLoading}
            fileName={fileName ?? ""}
            colors={colors}
          />

          {isError && (
            <View style={s.centered}>
              <Octicons name="alert" size={IconSize.lg} color={colors.danger} />
              <Text style={s.errorText}>Failed to load file</Text>
              <Text style={s.errorSubtext}>{(error as Error)?.message}</Text>
            </View>
          )}

          {showContent && data?.meta.download_url && (
            <View style={s.imageWrapper}>
              <VideoView
                player={videoPlayer}
                style={{
                  width: screenWidth - Spacing.lg * 2,
                  height: 300,
                  borderRadius: Radius.md,
                }}
                contentFit="contain"
                nativeControls
              />
            </View>
          )}
        </ScrollView>
      )}

      {!isImage && !isVideo && isPdf && (
        <View style={{ flex: 1 }}>
          <LoadingProgress
            isLoading={isLoading}
            fileName={fileName ?? ""}
            colors={colors}
          />

          {(isError || pdfError) && (
            <View style={s.centered}>
              <Octicons name="alert" size={IconSize.lg} color={colors.danger} />
              <Text style={s.errorText}>Failed to load PDF</Text>
              <Text style={s.errorSubtext}>
                {pdfError ?? (error as Error)?.message}
              </Text>
            </View>
          )}

          {showContent && !isError && !pdfError && !pdfDataUri && (
            <View style={s.centered}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          )}

          {pdfDataUri && !pdfError && (
            <Pdf
              source={{ uri: pdfDataUri }}
              trustAllCerts={false}
              style={{
                flex: 1,
                width: screenWidth,
                backgroundColor: colors.background,
              }}
              onError={(err) => setPdfError(String(err ?? "unknown error"))}
            />
          )}
        </View>
      )}

      {!isImage && !isVideo && !isPdf && (
        <ScrollView
          ref={contentScrollRef}
          style={s.contentScroll}
          contentContainerStyle={s.markdownContent}
          showsVerticalScrollIndicator={false}
        >
          <LoadingProgress
            isLoading={isLoading}
            fileName={fileName ?? ""}
            colors={colors}
          />

          {isError && (
            <View style={s.centered}>
              <Octicons name="alert" size={IconSize.lg} color={colors.danger} />
              <Text style={s.errorText}>Failed to load file</Text>
              <Text style={s.errorSubtext}>{(error as Error)?.message}</Text>
            </View>
          )}

          {showContent && (
            <>
              <View style={s.codeHeader}>
                <Pressable
                  style={({ pressed }) => [
                    s.copyButton,
                    pressed && s.copyButtonPressed,
                    copied && s.copyButtonCopied,
                  ]}
                  onPress={handleCopy}
                >
                  <Octicons
                    name={copied ? "check" : "copy"}
                    size={IconSize.sm}
                    color={copied ? colors.success : colors.textPrimary}
                  />
                </Pressable>
              </View>
              <MarkdownRenderer
                markdown={
                  isMarkdown
                    ? data.content
                    : `\`\`\`${fileName ? getLanguage(fileName) : ""}\n${data.content}\n\`\`\``
                }
                context={`${owner}/${repoName}`}
                onHeightChange={handleMarkdownHeightChange}
              />
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    contentScroll: {
      flex: 1,
    },

    scrollContentImage: {
      flexGrow: 1,
    },

    markdownContent: {
      padding: Layout.screenPadding,
      paddingBottom: Spacing.xxl,
    },

    codeHeader: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: Spacing.xs,
    },

    copyButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },

    copyButtonPressed: {
      opacity: 0.7,
      backgroundColor: colors.surfaceSecondary,
    },

    copyButtonCopied: {
      backgroundColor: colors.successSubtle,
      borderColor: colors.success,
    },

    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.xl,
      gap: Spacing.md,
      minHeight: 300,
    },

    progressContainer: {
      width: "100%",
      maxWidth: 280,
      alignItems: "center",
      gap: Spacing.sm,
    },

    progressTrack: {
      width: "100%",
      height: 6,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radius.full,
      overflow: "hidden",
    },

    progressFill: {
      height: "100%",
      backgroundColor: colors.accent,
      borderRadius: Radius.full,
    },

    loadingText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textMuted,
    },

    errorText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.title,
      textAlign: "center",
      color: colors.danger,
    },

    errorSubtext: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      textAlign: "center",
      color: colors.textMuted,
    },

    imageWrapper: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.lg,
      minHeight: 400,
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
