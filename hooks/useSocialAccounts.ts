import { fetchSocialAccounts } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useQuery } from "@tanstack/react-query";

export function useSocialAccounts() {
  return useQuery({
    queryKey: queryKeys.socialAccounts(),
    queryFn: fetchSocialAccounts,
    staleTime: 1000 * 60 * 30,
  });
}
