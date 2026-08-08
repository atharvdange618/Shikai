import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import { DeviceEventEmitter, Platform } from "react-native";

interface KeyboardShortcutHandlers {
  onTabSwitch?: (index: number) => void;
  onSearchFocus?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onEnter?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const subscription = DeviceEventEmitter.addListener(
      "KeyboardShortcut",
      (event: { action: string }) => {
        const { action } = event;

        const h = handlersRef.current;
        switch (action) {
          case "tab1":
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            h.onTabSwitch?.(0);
            break;
          case "tab2":
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            h.onTabSwitch?.(1);
            break;
          case "tab3":
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            h.onTabSwitch?.(2);
            break;
          case "tab4":
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            h.onTabSwitch?.(3);
            break;
          case "search":
            h.onSearchFocus?.();
            break;
          case "escape":
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            h.onEscape?.();
            break;
          case "arrowUp":
            Haptics.selectionAsync();
            h.onArrowUp?.();
            break;
          case "arrowDown":
            Haptics.selectionAsync();
            h.onArrowDown?.();
            break;
          case "enter":
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            h.onEnter?.();
            break;
        }
      },
    );

    return () => subscription.remove();
  }, []);
}
