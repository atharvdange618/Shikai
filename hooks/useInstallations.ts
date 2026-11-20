import { fetchUserInstallations } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useQuery } from "@tanstack/react-query";

export function useInstallations() {
  return useQuery({
    queryKey: queryKeys.installations(),
    queryFn: fetchUserInstallations,
    staleTime: 0,
    retry: false,
  });
}
