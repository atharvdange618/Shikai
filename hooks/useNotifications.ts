import { fetchNotifications } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth.store";
import { useInfiniteQuery } from "@tanstack/react-query";

const PER_PAGE = 50;

export function useNotifications(enabled: boolean = true) {
  const pat = useAuthStore((s) => s.pat);

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.notifications(), pat ? "pat" : "oauth"],
    queryFn: ({ pageParam }) => fetchNotifications(pageParam, PER_PAGE, true, pat),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,
    staleTime: 1000 * 60 * 2,
    enabled,
  });

  return {
    notifications: query.data?.pages.flatMap((p) => p.notifications) ?? [],
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
