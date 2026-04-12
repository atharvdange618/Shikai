import { Octicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  DarkColors,
  FontFamily,
  FontSize,
  LightColors,
  Spacing,
} from "@/constants/theme";
import { useFileTree, useRepo } from "@/hooks/useRepoDetails";
import type { GitHubTreeItem } from "@/types/github.types";

interface TreeNode {
  name: string;
  path: string;
  type: "blob" | "tree";
  children?: TreeNode[];
}

interface FlatTreeItem {
  node: TreeNode;
  depth: number;
  isExpanded: boolean;
}

function buildTree(items: GitHubTreeItem[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map = new Map<string, TreeNode>();

  const sorted = [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  for (const item of sorted) {
    const parts = item.path.split("/");
    const name = parts[parts.length - 1];
    const node: TreeNode = {
      name,
      path: item.path,
      type: item.type as "blob" | "tree",
    };

    if (item.type === "tree") node.children = [];

    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join("/");
      const parent = map.get(parentPath);
      if (parent?.children) parent.children.push(node);
    }

    map.set(item.path, node);
  }

  return root;
}

const TreeItem = memo(function TreeItem({
  item,
  onToggle,
  onFileSelect,
  colors,
}: {
  item: FlatTreeItem;
  onToggle: (path: string) => void;
  onFileSelect: (path: string) => void;
  colors: typeof LightColors | typeof DarkColors;
}) {
  const { node, depth, isExpanded } = item;
  const isDir = node.type === "tree";
  const indent = depth * 16;

  return (
    <Pressable
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 7,
        paddingLeft: Spacing.md + indent,
        paddingRight: Spacing.md,
        backgroundColor: pressed ? colors.surfaceSecondary : "transparent",
        gap: Spacing.sm,
      })}
      onPress={() => (isDir ? onToggle(node.path) : onFileSelect(node.path))}
    >
      {isDir && (
        <Octicons
          name={isExpanded ? "chevron-down" : "chevron-right"}
          size={12}
          color={colors.textMuted}
        />
      )}

      <Octicons
        name={
          isDir
            ? isExpanded
              ? "file-directory-open-fill"
              : "file-directory-fill"
            : "file"
        }
        size={14}
        color={isDir ? colors.star : colors.textSecondary}
        style={!isDir ? { marginLeft: 12 } : undefined}
      />

      <Text
        style={{
          fontFamily: FontFamily.mono,
          fontSize: FontSize.label,
          color: colors.textPrimary,
          flex: 1,
        }}
        numberOfLines={1}
      >
        {node.name}
      </Text>
    </Pressable>
  );
});

export default function FileExplorerScreen() {
  const { repoId } = useLocalSearchParams<{ repoId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DarkColors : LightColors;

  const [owner, repoName] = (repoId ?? "").split("__");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const { data: repo } = useRepo(owner, repoName);

  useEffect(() => {
    navigation.setOptions({
      title: `${repo?.name ?? "Repository"} Files`,
      headerBackTitle: repo?.name ?? "Back",
    });
  }, [navigation, repo?.name]);

  const { data: fileTreeData, isLoading } = useFileTree(
    owner,
    repoName,
    repo?.default_branch ?? "",
    true,
  );

  const toggleFolder = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleFileSelect = useCallback(
    (path: string) => {
      const fileName = path.split("/").pop() ?? path;
      router.push({
        pathname: "/repos/[repoId]/file",
        params: { repoId, path, fileName },
      });
    },
    [router, repoId],
  );

  const tree = useMemo(
    () => buildTree(fileTreeData?.tree ?? []),
    [fileTreeData?.tree],
  );

  const flattenedTree = useMemo(() => {
    const result: FlatTreeItem[] = [];

    function traverse(nodes: TreeNode[], depth: number) {
      for (const node of nodes) {
        const isExpanded = expandedPaths.has(node.path);
        result.push({ node, depth, isExpanded });

        if (node.type === "tree" && isExpanded && node.children) {
          traverse(node.children, depth + 1);
        }
      }
    }

    traverse(tree, 0);
    return result;
  }, [tree, expandedPaths]);

  const renderItem = useCallback(
    ({ item }: { item: FlatTreeItem }) => (
      <TreeItem
        item={item}
        onToggle={toggleFolder}
        onFileSelect={handleFileSelect}
        colors={colors}
      />
    ),
    [toggleFolder, handleFileSelect, colors],
  );

  const getItemType = useCallback(
    (item: FlatTreeItem) => (item.node.type === "tree" ? "folder" : "file"),
    [],
  );

  const s = buildStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={["bottom"]}>
      {isLoading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator color={colors.accent} />
          <Text style={s.loadingText}>{`Loading ${repoName} file tree…`}</Text>
        </View>
      ) : flattenedTree.length === 0 ? (
        <View style={s.loadingContainer}>
          <Text style={s.loadingText}>No files found</Text>
        </View>
      ) : (
        <FlashList
          data={flattenedTree}
          renderItem={renderItem}
          getItemType={getItemType}
          keyExtractor={(item) => item.node.path}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Spacing.lg,
          }}
        />
      )}
    </SafeAreaView>
  );
}

function buildStyles(colors: typeof LightColors | typeof DarkColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.md,
    },

    loadingText: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.body,
      color: colors.textMuted,
    },
  });
}
