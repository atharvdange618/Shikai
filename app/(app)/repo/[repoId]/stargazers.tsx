import { useLocalSearchParams } from "expo-router";

import { UserList } from "@/components/shared/UserList";
import { useStargazers } from "@/hooks/useRepoStarsForks";
import { decodeRepoId } from "@/lib/utils";

export default function StargazersScreen() {
  const { repoId } = useLocalSearchParams<{ repoId: string }>();
  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const query = useStargazers(owner, repoName);

  return (
    <UserList
      {...query}
      emptyText="No stargazers yet"
      errorText="Failed to load stargazers"
    />
  );
}
