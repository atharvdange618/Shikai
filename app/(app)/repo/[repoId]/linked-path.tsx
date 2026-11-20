import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";

import { FileError } from "@/components/file/FileError";
import { FileLoading } from "@/components/file/FileLoading";
import { resolveLinkedPath } from "@/lib/github-graphql";
import { decodeRepoId } from "@/lib/utils";

function readSegments(value: string | undefined): string[] {
  try {
    const parsed: unknown = JSON.parse(value ?? "null");
    if (!Array.isArray(parsed)) return [];
    const parts: unknown[] = parsed;
    return parts.every((part): part is string => typeof part === "string" && part.length > 0)
      ? parts
      : [];
  } catch {
    return [];
  }
}

export default function LinkedPathScreen() {
  const { repoId, kind, segments, line } = useLocalSearchParams<{
    repoId: string;
    kind?: string;
    segments?: string;
    line?: string;
  }>();
  const router = useRouter();
  const [owner, repo] = decodeRepoId(repoId ?? "");
  const parts = readSegments(segments);
  const valid = Boolean(owner && repo && (kind === "tree" || kind === "blob") && parts.length > 0);
  const { data, error } = useQuery({
    queryKey: ["repo", owner, repo, "linkedPath", kind, parts],
    queryFn: () => resolveLinkedPath(owner, repo, parts, kind === "blob" ? "blob" : "tree"),
    enabled: valid,
    gcTime: 0,
    meta: { persist: false },
  });

  useEffect(() => {
    if (!data) return;
    const path = encodeURIComponent(data.path);
    if (kind === "blob") {
      router.replace({
        pathname: "/(app)/repo/[repoId]/file",
        params: {
          repoId,
          path,
          ref: data.revision,
          fileName: encodeURIComponent(data.path.split("/").at(-1) ?? ""),
          line,
        },
      });
    } else {
      router.replace({
        pathname: "/(app)/repo/[repoId]/files",
        params: { repoId, path, ref: data.revision, refLabel: encodeURIComponent(data.ref) },
      });
    }
  }, [data, kind, line, repoId, router]);

  if (!valid || error) {
    return <FileError title="Could not open GitHub link" message={error?.message} />;
  }
  return <FileLoading isLoading fileName="GitHub link" />;
}
