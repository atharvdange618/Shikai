import { fetchRecentActivity } from "@/lib/github-graphql";
import { useQuery } from "@tanstack/react-query";

export function useRecentActivity() {
  return useQuery({
    queryKey: ["recentActivity"],
    queryFn: fetchRecentActivity,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
