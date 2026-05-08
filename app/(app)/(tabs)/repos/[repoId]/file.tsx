import { Octicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SyntaxHighlighter from "react-native-syntax-highlighter";
import {
  atomDark,
  ghcolors,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import {
  DarkColors,
  FontFamily,
  FontSize,
  IconSize,
  LightColors,
  Radius,
  Spacing,
} from "@/constants/theme";
import { useFileContent } from "@/hooks/useRepoDetails";
import { getLanguage, isImageFile } from "@/lib/utils";

interface LoadingProgressProps {
  isLoading: boolean;
  fileName: string;
  colors: typeof LightColors | typeof DarkColors;
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

  if (!visible) return null;

  const s = buildStyles(colors);

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
  const { repoId, path, fileName } = useLocalSearchParams<{
    repoId: string;
    path: string;
    fileName: string;
  }>();
  const navigation = useNavigation();
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  const { width: screenWidth } = useWindowDimensions();

  const [owner, repoName] = (repoId ?? "").split("__");
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);

  const isImage = useMemo(
    () => (fileName ? isImageFile(fileName) : false),
    [fileName],
  );

  useEffect(() => {
    if (fileName) {
      try {
        navigation.setOptions({
          title: fileName,
        });
      } catch {
        /* navigator not ready yet */
      }
    }
  }, [navigation, fileName]);

  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [path]);

  const { data, isLoading, isError, error } = useFileContent(
    owner,
    repoName,
    path ?? "",
    true,
  );

  const handleCopy = useCallback(async () => {
    if (!data?.content) return;
    await Clipboard.setStringAsync(data.content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data?.content]);

  const s = buildStyles(colors);

  const showContent = data && !isLoading && !isError;

  return (
    <SafeAreaView style={s.container} edges={["bottom"]}>
      <ScrollView
        style={s.contentScroll}
        contentContainerStyle={isImage ? s.scrollContentImage : undefined}
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
            {isImage ? (
              <View style={s.imageWrapper}>
                {(imageLoading || imageError) && (
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
                {data.meta.download_url && !imageError && (
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
                )}
              </View>
            ) : (
              <View style={s.contentWrapper}>
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
                    <Text
                      style={[
                        s.copyButtonText,
                        copied && s.copyButtonTextCopied,
                      ]}
                    >
                      {copied ? "Copied!" : "Copy"}
                    </Text>
                  </Pressable>
                </View>
                <SyntaxHighlighter
                  language={fileName ? getLanguage(fileName) : "text"}
                  style={isDark ? atomDark : ghcolors}
                  customStyle={{
                    backgroundColor: "transparent",
                    padding: 0,
                  }}
                  PreTag={View}
                  CodeTag={Text}
                  fontSize={FontSize.body}
                  highlighter="prism"
                  fontFamily={FontFamily.regular}
                >
                  {data.content}
                </SyntaxHighlighter>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function buildStyles(colors: typeof LightColors | typeof DarkColors) {
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

    contentWrapper: {
      padding: Spacing.lg,
    },

    codeHeader: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: Spacing.sm,
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

    copyButtonText: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textPrimary,
    },

    copyButtonTextCopied: {
      color: colors.success,
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
