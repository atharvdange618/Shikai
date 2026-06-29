import { StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { memo } from "react";

export const ListItemSeparator = memo(function ListItemSeparator() {
  return <View style={styles.separator} />;
});

const styles = StyleSheet.create({
  separator: {
    height: Spacing.sm,
  },
});
