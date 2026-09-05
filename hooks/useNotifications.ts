import { fetchNotifications } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth.store";
import { useInfinitePagedQuery } from "@/hooks/useInfinitePagedQuery";

const PER_PAGE = 50;

export function useNotifications(enabled: boolean = true) {
  const pat = useAuthStore((s) => s.pat);

  const { items: notifications, ...rest } = useInfinitePagedQuery(
    {
      queryKey: [...queryKeys.notifications(), pat ? "pat" : "oauth"],
      queryFn: ({ pageParam }) =>
        fetchNotifications(pageParam, PER_PAGE, true, pat),
      staleTime: 1000 * 60 * 2,
      enabled,
    },
    (data) => data?.pages.flatMap((p) => p.notifications) ?? [],
  );

  return { notifications, ...rest };
}
