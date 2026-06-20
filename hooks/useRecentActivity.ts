import { fetchRecentActivity } from "@/lib/github-graphql";
import { queryKeys } from "@/lib/query-client";
import { useQuery } from "@tanstack/react-query";

export function useRecentActivity() {
  return useQuery({
    queryKey: queryKeys.recentActivity(),
    queryFn: fetchRecentActivity,
    staleTime: 1000 * 60 * 5,
  });
}
