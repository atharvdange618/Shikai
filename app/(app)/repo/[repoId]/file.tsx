import { Octicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components";
import { CodeViewer } from "@/components/file/CodeViewer";
import { FileError } from "@/components/file/FileError";
import { ImageViewer } from "@/components/file/ImageViewer";
import { LoadingProgress } from "@/components/file/LoadingProgress";
import { MarkdownViewer } from "@/components/file/MarkdownViewer";
import { PdfViewer } from "@/components/file/PdfViewer";
import { VideoViewer } from "@/components/file/VideoViewer";
import { Spacing, useTheme } from "@/constants/theme";
import { useFileContent, useRepo } from "@/hooks/useRepoDetails";
import { decodeRepoId, getFileKind } from "@/lib/utils";

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

  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const { data: repo } = useRepo(owner, repoName);
  const kind = getFileKind(fileName ?? "");
  const canBlame = kind === "text" || kind === "markdown";

  useEffect(() => {
    if (fileName) {
      try {
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
                        path: path ?? "",
                        ref: repo?.default_branch ?? "HEAD",
                        fileName,
                      },
                    })
                  }
                  hitSlop={8}
                  style={s.headerButton}
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
                style={s.headerButton}
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

  const { data, isLoading, isError, error } = useFileContent(
    owner,
    repoName,
    path ?? "",
    true,
  );

  return (
    <SafeAreaView
      style={[s.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <LoadingProgress isLoading={isLoading} fileName={fileName ?? ""} />
      {isError && (
        <FileError
          title={kind === "pdf" ? "Failed to load PDF" : "Failed to load file"}
          message={error?.message}
        />
      )}
      {data && !isLoading && !isError && renderViewer()}
    </SafeAreaView>
  );

  function renderViewer() {
    if (!data) return null;
    const url = data.meta.download_url;

    const targetLine = line ? Number(line) : undefined;

    // GitHub's contents API leaves out the body of files over 1 MB.
    if (
      (kind === "text" || kind === "markdown") &&
      data.meta.encoding === "none"
    ) {
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
          content={data.content}
          fileName={fileName ?? ""}
          targetLine={targetLine}
        />
      );
    }

    if (kind === "markdown") {
      return (
        <MarkdownViewer
          key={path}
          content={data.content}
          path={path ?? ""}
          repoContext={`${owner}/${repoName}`}
          targetLine={targetLine}
        />
      );
    }

    if (!url) {
      return (
        <FileError
          title="Failed to load file"
          message="GitHub returned no download link"
        />
      );
    }

    switch (kind) {
      case "image":
        return (
          <ImageViewer
            key={url}
            url={url}
            isSvg={fileName?.toLowerCase().endsWith(".svg") ?? false}
          />
        );
      case "video":
        return <VideoViewer key={url} url={url} />;
      case "pdf":
        return <PdfViewer key={url} url={url} />;
    }
  }
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
