import { fetchUserInstallations } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useQuery } from "@tanstack/react-query";

export function useInstallations() {
  return useQuery({
    queryKey: queryKeys.installations(),
    queryFn: fetchUserInstallations,
    staleTime: 1000 * 60 * 30,
    // PAT sign-ins can't list app installations; no point retrying.
    retry: false,
  });
}
