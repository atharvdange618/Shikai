import { fetchUserInstallations } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useQuery } from "@tanstack/react-query";

export function useInstallations() {
  return useQuery({
    queryKey: queryKeys.installations(),
    queryFn: fetchUserInstallations,
    // Always stale, so returning from GitHub's install page refetches on
    // focus and the access hint reflects the change right away.
    staleTime: 0,
    // PAT sign-ins can't list app installations; no point retrying.
    retry: false,
  });
}
