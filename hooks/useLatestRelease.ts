import { fetchLatestRelease } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useMemo } from "react";

const OWNER = "atharvdange618";
const REPO = "Shikai";

export const latestReleaseQueryOptions = queryOptions({
  queryKey: queryKeys.latestRelease(),
  queryFn: fetchLatestRelease,
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 24,
});

function parseVersion(version: string): [number, number, number] {
  const clean = version.replace(/^v/, "").split("-")[0];
  const parts = clean.split(".").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function isNewer(latest: string, current: string): boolean {
  const [lMaj, lMin, lPat] = parseVersion(latest);
  const [cMaj, cMin, cPat] = parseVersion(current);

  if (lMaj !== cMaj) return lMaj > cMaj;
  if (lMin !== cMin) return lMin > cMin;
  return lPat > cPat;
}

export function useLatestRelease() {
  const query = useQuery(latestReleaseQueryOptions);

  const currentVersion = Constants.expoConfig?.version ?? "1.0.0";

  const updateAvailable = useMemo(() => {
    if (!query.data?.tag_name) return false;
    return isNewer(query.data.tag_name, currentVersion);
  }, [query.data?.tag_name, currentVersion]);

  return {
    release: query.data ?? null,
    updateAvailable,
    currentVersion,
    latestVersion: query.data?.tag_name?.replace(/^v/, "") ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    releaseUrl: query.data?.html_url ?? `https://github.com/${OWNER}/${REPO}/releases/latest`,
  };
}
