import { useCallback } from "react";

export function usePrefetchOnPress(
  onPress: () => void,
  prefetchFn: () => void,
) {
  const handlePressIn = useCallback(() => {
    prefetchFn();
  }, [prefetchFn]);

  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  return { onPress: handlePress, onPressIn: handlePressIn };
}
