import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ToastAndroid } from "react-native";

/**
 * Copies text and sets `copied` for two seconds. A failed copy shows a toast
 * instead of failing silently.
 */
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
    } catch (error) {
      console.error("Copy to clipboard failed", error);
      ToastAndroid.show("Couldn't copy to the clipboard", ToastAndroid.SHORT);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    AccessibilityInfo.announceForAccessibility("Copied");
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return { copied, copy };
}
