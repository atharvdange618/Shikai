import { fetchSocialAccounts } from "@/lib/github-rest";
import { useQuery } from "@tanstack/react-query";

export function useSocialAccounts() {
  return useQuery({
    queryKey: ["socialAccounts"],
    queryFn: fetchSocialAccounts,
    staleTime: 1000 * 60 * 10,
  });
}
