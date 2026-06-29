import { Octicons } from "@expo/vector-icons";
import { forwardRef, useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import {
  type ColorTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
  useTheme,
} from "@/constants/theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  textInputProps?: Partial<TextInputProps>;
}

export const SearchBar = forwardRef<TextInput, SearchBarProps>(
  function SearchBar(
    { value, onChangeText, placeholder = "Search…", textInputProps },
    ref,
  ) {
    const { colors } = useTheme();
    const s = useMemo(() => buildStyles(colors), [colors]);

    return (
      <View style={s.container}>
        <Octicons
          name="search"
          size={15}
          color={colors.textMuted}
          style={s.icon}
        />

        <TextInput
          ref={ref}
          style={s.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="never"
          accessibilityLabel={placeholder}
          {...textInputProps}
        />

        {value.length > 0 && (
          <Pressable
            onPress={() => onChangeText("")}
            hitSlop={12}
            style={s.clearButton}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <Octicons name="x-circle-fill" size={15} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
    );
  },
);

function buildStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceSecondary,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      height: 44,
    },

    icon: {
      marginRight: Spacing.sm,
    },

    input: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textPrimary,
      paddingVertical: 0,
    },

    clearButton: {
      padding: Spacing.xs,
      marginLeft: Spacing.xs,
      minWidth: 40,
      minHeight: 40,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
