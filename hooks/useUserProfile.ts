import { useQuery } from "@tanstack/react-query";

import { fetchUserProfile } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: queryKeys.userProfile(username),
    queryFn: () => fetchUserProfile(username),
    enabled: Boolean(username),
    staleTime: 1000 * 60 * 10,
  });
}
