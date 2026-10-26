import { useLocalSearchParams } from "expo-router";

import { UserList } from "@/components/shared/UserList";
import { useFollowers } from "@/hooks/useFollows";

export default function FollowersScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const query = useFollowers(username ?? "");

  return (
    <UserList
      {...query}
      emptyText="No followers yet"
      errorText="Failed to load followers"
    />
  );
}
