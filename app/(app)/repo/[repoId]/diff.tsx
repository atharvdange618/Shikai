import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CodeViewer } from "@/components/file/CodeViewer";
import { FileError } from "@/components/file/FileError";
import { FileLoading } from "@/components/file/FileLoading";
import type { DiffSource } from "@/components/repo/DiffFileList";
import { useTheme } from "@/constants/theme";
import { useCommitDetail } from "@/hooks/useCommitDetail";
import { useComparison } from "@/hooks/useComparison";
import { usePullRequestFile } from "@/hooks/usePullRequestDetail";
import { decodeRepoId } from "@/lib/utils";

export default function DiffScreen() {
  return (
    <ErrorBoundary fallback="back">
      <DiffScreenContent />
    </ErrorBoundary>
  );
}

function DiffScreenContent() {
  const params = useLocalSearchParams<{
    repoId: string;
    filename: string;
    source: DiffSource["source"];
    number?: string;
    sha?: string;
    base?: string;
    head?: string;
  }>();
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(params.repoId ?? "");
  const filename = params.filename ?? "";
  const baseName = filename.split("/").pop() ?? filename;

  // All three hooks run, but only the one matching the source is enabled. Each
  // query is already cached by the screen that pushed this one.
  const pr = usePullRequestFile(
    owner,
    repoName,
    params.source === "pr" ? Number(params.number) : 0,
    filename,
  );
  const commit = useCommitDetail(
    owner,
    repoName,
    params.source === "commit" ? (params.sha ?? "") : "",
  );
  const compare = useComparison(
    owner,
    repoName,
    params.source === "compare" ? (params.base ?? "") : "",
    params.source === "compare" ? (params.head ?? "") : "",
  );
  const query =
    params.source === "pr" ? pr : params.source === "commit" ? commit : compare;
  const file =
    params.source === "pr"
      ? pr.file
      : (params.source === "commit"
          ? commit.data?.files
          : compare.data?.files
        )?.find((f) => f.filename === filename);

  useEffect(() => {
    try {
      navigation.setOptions({ title: baseName });
    } catch {
      /* navigator not ready yet */
    }
  }, [navigation, baseName]);

  return (
    <SafeAreaView
      style={[s.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <FileLoading isLoading={query.isLoading} fileName={baseName} />
      {query.isError && (
        <FileError title="Failed to load diff" message={query.error?.message} />
      )}
      {!query.isLoading && !query.isError && renderDiff()}
    </SafeAreaView>
  );

  function renderDiff() {
    if (!file) {
      return <FileError title="File not found in this diff" />;
    }
    if (!file.patch) {
      return (
        <FileError
          title={
            file.status === "renamed"
              ? "File renamed, no content changes"
              : "No diff to show"
          }
          message={
            file.status === "renamed"
              ? undefined
              : "Binary file, or the diff is too large for GitHub to send."
          }
        />
      );
    }
    return (
      <CodeViewer key={filename} content={file.patch} fileName={filename} diff />
    );
  }
}

const s = StyleSheet.create({
  container: { flex: 1 },
});
