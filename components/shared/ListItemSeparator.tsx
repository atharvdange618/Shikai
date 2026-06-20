import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";

export const ListItemSeparator = memo(function ListItemSeparator() {
  return <View style={styles.separator} />;
});

const styles = StyleSheet.create({
  separator: {
    height: Spacing.sm,
  },
});
