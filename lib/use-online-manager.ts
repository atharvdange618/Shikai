import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import { useEffect } from "react";

export function useOnlineManager() {
  useEffect(() => {
    return NetInfo.addEventListener((state: NetInfoState) => {
      onlineManager.setOnline(
        state.isConnected != null &&
        state.isConnected &&
        Boolean(state.isInternetReachable),
      );
    });
  }, []);
}
