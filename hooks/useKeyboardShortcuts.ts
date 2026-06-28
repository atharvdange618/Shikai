import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Platform } from "react-native";

interface KeyboardShortcutHandlers {
  onTabSwitch?: (index: number) => void;
  onSearchFocus?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onEnter?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const { DeviceEventEmitter } = require("react-native");
    const subscription = DeviceEventEmitter.addListener(
      "KeyboardShortcut",
      (event: { action: string }) => {
        const { action } = event;

        switch (action) {
          case "tab1":
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handlers.onTabSwitch?.(0);
            break;
          case "tab2":
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handlers.onTabSwitch?.(1);
            break;
          case "tab3":
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handlers.onTabSwitch?.(2);
            break;
          case "tab4":
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handlers.onTabSwitch?.(3);
            break;
          case "search":
            handlers.onSearchFocus?.();
            break;
          case "escape":
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handlers.onEscape?.();
            break;
          case "arrowUp":
            Haptics.selectionAsync();
            handlers.onArrowUp?.();
            break;
          case "arrowDown":
            Haptics.selectionAsync();
            handlers.onArrowDown?.();
            break;
          case "enter":
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handlers.onEnter?.();
            break;
        }
      },
    );

    return () => subscription.remove();
  }, [
    handlers.onTabSwitch,
    handlers.onSearchFocus,
    handlers.onEscape,
    handlers.onArrowUp,
    handlers.onArrowDown,
    handlers.onEnter,
  ]);
}
