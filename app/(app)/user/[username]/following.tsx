import { useLocalSearchParams } from "expo-router";

import { UserList } from "@/components/shared/UserList";
import { useFollowing } from "@/hooks/useFollows";

export default function FollowingScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const query = useFollowing(username ?? "");

  return (
    <UserList
      {...query}
      emptyText="Not following anyone"
      errorText="Failed to load following"
    />
  );
}
