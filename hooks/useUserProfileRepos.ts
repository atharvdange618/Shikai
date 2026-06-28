import { useQuery } from "@tanstack/react-query";

import { fetchUserRepos } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";

export function useUserProfileRepos(username: string) {
  return useQuery({
    queryKey: queryKeys.userProfileRepos(username),
    queryFn: () => fetchUserRepos(username),
    enabled: Boolean(username),
    staleTime: 1000 * 60 * 5,
  });
}
