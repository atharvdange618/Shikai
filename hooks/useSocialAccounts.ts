import { useQuery } from "@tanstack/react-query";
import { fetchSocialAccounts } from "@/lib/github-rest";

export function useSocialAccounts() {
  return useQuery({
    queryKey: ["socialAccounts"],
    queryFn: fetchSocialAccounts,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
