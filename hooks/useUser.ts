import { fetchAuthenticatedUser } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import { queryOptions, useQuery } from "@tanstack/react-query";

export const userQueryOptions = queryOptions({
  queryKey: queryKeys.user(),
  queryFn: () => fetchAuthenticatedUser(),
  staleTime: 1000 * 60 * 30,
});

export function useUser() {
  return useQuery(userQueryOptions);
}

export function useUsername(): string | undefined {
  return useQuery(userQueryOptions).data?.login;
}

export function useUserAvatarUrl(): string | undefined {
  return useQuery(userQueryOptions).data?.avatar_url;
}
