import {
  useInfiniteQuery,
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryOptions,
} from "@tanstack/react-query";

interface Paged {
  pagination: { next?: number };
}

type PagedQueryOptions<TQueryFnData extends Paged, TData> = Omit<
  UseInfiniteQueryOptions<TQueryFnData, Error, TData, QueryKey, number>,
  "initialPageParam" | "getNextPageParam"
>;

/**
 * Wraps useInfiniteQuery for the REST endpoints that all page the same way
 * (numeric page param, `pagination.next` from the Link header) and return
 * the same result shape. Callers just supply how to pull the item array out
 * of the (possibly `select`-transformed) data.
 */
export function useInfinitePagedQuery<
  TQueryFnData extends Paged,
  TItem,
  TData = InfiniteData<TQueryFnData>,
>(
  options: PagedQueryOptions<TQueryFnData, TData>,
  flatten: (data: TData | undefined) => TItem[],
) {
  const query = useInfiniteQuery({
    initialPageParam: 1,
    getNextPageParam: (lastPage: TQueryFnData) =>
      lastPage.pagination.next ?? undefined,
    ...options,
  });

  return {
    items: flatten(query.data),
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
