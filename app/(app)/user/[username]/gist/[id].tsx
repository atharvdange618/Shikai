import { Octicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { useGist } from "@/hooks/useGists";
import { relativeTime } from "@/lib/utils";
import type { GitHubGistFile } from "@/types/github.types";

import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Layout,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";

const MARKDOWN_EXT = /\.(md|markdown)$/i;

function toMarkdown(file: GitHubGistFile): string {
  const content = file.content ?? "";
  if (MARKDOWN_EXT.test(file.filename)) return content;
  const lang =
    file.language?.toLowerCase() ??
    file.filename.split(".").pop()?.toLowerCase() ??
    "";
  const fence = "```";
  return `${fence}${lang}\n${content}\n${fence}`;
}

export default function GistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { data: gist, isLoading, isError, refetch } = useGist(id ?? "");

  const s = useMemo(() => buildStyles(colors), [colors]);

  const files = useMemo(
    () => (gist ? Object.values(gist.files) : []),
    [gist],
  );

  useEffect(() => {
    try {
      navigation.setOptions({
        title: files[0]?.filename ?? "Gist",
      });
    } catch {
      /* navigator not ready yet */
    }
  }, [navigation, files]);

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isError || !gist) {
    return (
      <View style={s.centered}>
        <Octicons name="alert" size={28} color={colors.danger} />
        <Text style={s.errorText}>Couldn{"'"}t load this gist</Text>
        <Pressable style={s.retry} onPress={() => refetch()}>
          <Text style={s.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {gist.description ? (
        <Text style={s.description}>{gist.description}</Text>
      ) : null}
      <Text style={s.meta}>
        {gist.owner.login} · updated {relativeTime(gist.updated_at)}
      </Text>

      {files.map((file) => (
        <View key={file.filename} style={s.fileBlock}>
          <View style={s.fileHeader}>
            <Octicons name="file" size={13} color={colors.textMuted} />
            <Text style={s.fileName} numberOfLines={1}>
              {file.filename}
            </Text>
          </View>

          {file.content == null || file.truncated ? (
            <Pressable
              style={s.truncated}
              onPress={() => WebBrowser.openBrowserAsync(file.raw_url)}
            >
              <Text style={s.truncatedText}>
                File too large to preview. Open raw file
              </Text>
              <Octicons
                name="link-external"
                size={12}
                color={colors.accent}
              />
            </Pressable>
          ) : (
            <MarkdownRenderer markdown={toMarkdown(file)} />
          )}
        </View>
      ))}

      <Pressable
        style={({ pressed }) => [s.githubButton, pressed && { opacity: 0.7 }]}
        onPress={() => WebBrowser.openBrowserAsync(gist.html_url)}
      >
        <Octicons name="mark-github" size={16} color={colors.textSecondary} />
        <Text style={s.githubButtonText}>View on GitHub</Text>
        <Octicons name="link-external" size={12} color={colors.textMuted} />
      </Pressable>
    </ScrollView>
  );
}

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: Layout.screenPadding,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xxl,
      gap: Spacing.md,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.md,
      backgroundColor: colors.background,
    },
    description: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textPrimary,
      lineHeight: FontSize.body * 1.5,
    },
    meta: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.caption,
      color: colors.textMuted,
    },
    fileBlock: {
      gap: Spacing.xs,
      marginTop: Spacing.sm,
    },
    fileHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
    fileName: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.label,
      color: colors.textSecondary,
    },
    truncated: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      padding: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    truncatedText: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.label,
      color: colors.accent,
    },
    errorText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: colors.textSecondary,
    },
    retry: {
      backgroundColor: colors.accent,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    retryText: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.body,
      color: "#FFFFFF",
    },
    githubButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      marginTop: Spacing.md,
    },
    githubButtonText: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.body,
      color: colors.textSecondary,
    },
  });
}
