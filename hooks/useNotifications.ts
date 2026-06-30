import { fetchNotifications } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { useInfiniteQuery } from "@tanstack/react-query";

const PER_PAGE = 50;

export function useNotifications() {
  const query = useInfiniteQuery({
    queryKey: queryKeys.notifications(),
    queryFn: ({ pageParam }) => fetchNotifications(pageParam, PER_PAGE, true),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.pagination.next ?? undefined,
    staleTime: 1000 * 60 * 2,
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
