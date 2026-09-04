import { useQueries } from "@tanstack/react-query";

import { searchIssues } from "@/lib/github-rest";
import { queryKeys } from "@/lib/query-client";

const PER_PAGE = 20;

export type MyWorkSectionKey =
  | "review-requested"
  | "assigned"
  | "created"
  | "mentioned";

export const MY_WORK_SECTIONS: {
  key: MyWorkSectionKey;
  title: string;
  query: string;
}[] = [
  {
    key: "review-requested",
    title: "Review requested",
    query: "is:open is:pr review-requested:@me archived:false",
  },
  {
    key: "assigned",
    title: "Assigned to you",
    query: "is:open assignee:@me archived:false",
  },
  {
    key: "created",
    title: "Created by you",
    query: "is:open author:@me archived:false",
  },
  {
    key: "mentioned",
    title: "Mentions you",
    query: "is:open mentions:@me archived:false",
  },
];

export function useMyWork() {
  const results = useQueries({
    queries: MY_WORK_SECTIONS.map((section) => ({
      queryKey: queryKeys.searchIssues(section.query),
      queryFn: () => searchIssues(section.query, 1, PER_PAGE, "updated", "desc"),
      staleTime: 1000 * 60 * 2,
      meta: { persist: false },
    })),
  });

  const sections = MY_WORK_SECTIONS.map((section, i) => ({
    ...section,
    issues: results[i].data?.issues ?? [],
    totalCount: results[i].data?.totalCount ?? 0,
  }));

  return {
    sections,
    isLoading: results.every((r) => r.isLoading),
    isError: results.every((r) => r.isError),
    refetch: () => Promise.all(results.map((r) => r.refetch())),
  };
}
