import { memo } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";

import { DarkColors, LightColors } from "@/constants/theme";

export const ListItemSeparator = memo(function ListItemSeparator() {
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;
  return <View style={[styles.separator, { backgroundColor: colors.border }]} />;
});

const styles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
