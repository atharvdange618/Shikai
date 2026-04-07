import { fetchAuthenticatedUser } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";
import type { GitHubUser } from "@/types/github.types";
import { queryOptions, useQuery } from "@tanstack/react-query";

export const userQueryOptions = queryOptions({
  queryKey: queryKeys.user(),
  queryFn: fetchAuthenticatedUser,
  staleTime: 1000 * 60 * 10,
});

export function useUser() {
  return useQuery(userQueryOptions);
}

export function useUsername(): string | undefined {
  return useQuery({
    ...userQueryOptions,
    select: (user: GitHubUser) => user.login,
  }).data;
}

export function useUserAvatarUrl(): string | undefined {
  return useQuery({
    ...userQueryOptions,
    select: (user: GitHubUser) => user.avatar_url,
  }).data;
}
