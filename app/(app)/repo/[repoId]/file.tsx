import { Octicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useLayoutEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CodeViewer } from "@/components/file/CodeViewer";
import { FileError } from "@/components/file/FileError";
import { FileLoading } from "@/components/file/FileLoading";
import { ImageViewer } from "@/components/file/ImageViewer";
import { MarkdownViewer } from "@/components/file/MarkdownViewer";
import { PdfViewer } from "@/components/file/PdfViewer";
import { VideoViewer } from "@/components/file/VideoViewer";
import { Spacing, useTheme } from "@/constants/theme";
import { useFileContent, useRepo } from "@/hooks/useRepoDetails";
import { decodeRepoId, getFileKind, isSvgFile, parseTargetLine } from "@/lib/utils";

export default function FileViewerScreen() {
  return (
    <ErrorBoundary fallback="back">
      <FileViewerScreenContent />
    </ErrorBoundary>
  );
}

function FileViewerScreenContent() {
  const { repoId, path, fileName, line, ref } = useLocalSearchParams<{
    repoId: string;
    path: string;
    fileName: string;
    line?: string;
    ref?: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const { data: repo } = useRepo(owner, repoName);
  const targetLine = parseTargetLine(line);
  const kind = getFileKind(fileName ?? "", targetLine);
  const canBlame = kind === "text" || kind === "markdown";

  useLayoutEffect(() => {
    if (fileName) {
      navigation.setOptions({
        title: fileName,
        headerRight: () => (
          <View style={s.headerActions}>
            {canBlame && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(app)/repo/[repoId]/blame",
                    params: {
                      repoId: repoId ?? "",
                      path: encodeURIComponent(path ?? ""),
                      ref: encodeURIComponent(ref ?? repo?.default_branch ?? "HEAD"),
                      fileName: encodeURIComponent(fileName),
                    },
                  })
                }
                hitSlop={8}
                style={s.headerButton}
                accessibilityRole="button"
                accessibilityLabel="Blame"
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
                    path: encodeURIComponent(path ?? ""),
                    fileName: encodeURIComponent(fileName),
                    ref: ref ? encodeURIComponent(ref) : undefined,
                  },
                })
              }
              hitSlop={8}
              style={s.headerButton}
              accessibilityRole="button"
              accessibilityLabel="File history"
            >
              <Octicons name="history" size={20} color={colors.accent} />
            </Pressable>
          </View>
        ),
      });
    }
  }, [
    navigation,
    router,
    fileName,
    repoId,
    path,
    ref,
    colors.accent,
    canBlame,
    repo?.default_branch,
  ]);

  const { data, isLoading, isError, error } = useFileContent(
    owner,
    repoName,
    path ?? "",
    true,
    ref,
  );

  function renderViewer(file: NonNullable<typeof data>) {
    const url = file.meta.download_url;

    if (kind === "binary") {
      return <FileError title="Binary file" message="Shikai can't preview this file type." />;
    }

    if ((kind === "text" || kind === "markdown") && file.meta.encoding === "none") {
      return (
        <FileError
          title="File too large to preview"
          message="GitHub doesn't send the contents of files over 1 MB."
        />
      );
    }

    if (kind === "text") {
      return (
        <CodeViewer
          key={path}
          content={file.content}
          fileName={fileName ?? ""}
          targetLine={targetLine}
        />
      );
    }

    if (kind === "markdown") {
      return (
        <MarkdownViewer
          key={path}
          content={file.content}
          path={path ?? ""}
          repoContext={`${owner}/${repoName}`}
          gitRef={ref}
        />
      );
    }

    if (!url) {
      return <FileError title="Failed to load file" message="GitHub returned no download link" />;
    }

    switch (kind) {
      case "image":
        return <ImageViewer key={url} url={url} isSvg={isSvgFile(fileName ?? "")} />;
      case "video":
        return <VideoViewer key={url} url={url} />;
      case "pdf":
        return <PdfViewer key={url} url={url} />;
    }
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <FileLoading isLoading={isLoading} fileName={fileName ?? ""} />
      {isError && (
        <FileError
          title={kind === "pdf" ? "Failed to load PDF" : "Failed to load file"}
          message={error?.message}
        />
      )}
      {data && !isLoading && !isError && renderViewer(data)}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerButton: {
    paddingHorizontal: Spacing.sm,
  },
});
