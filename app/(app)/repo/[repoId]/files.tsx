import { Octicons } from "@expo/vector-icons";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FileError } from "@/components/file/FileError";
import { BranchSelector } from "@/components/repo/BranchSelector";
import { SearchBar } from "@/components/shared/SearchBar";
import { type ColorTokens, FontFamily, FontSize, Spacing, useTheme } from "@/constants/theme";
import { useBranches, useFileTree, useRepo } from "@/hooks/useRepoDetails";
import { prefetchCommonFiles, prefetchFileContent } from "@/lib/prefetch";
import { decodeRepoId } from "@/lib/utils";
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
  onFilePressIn,
  colors,
  searchMode,
}: {
  item: FlatTreeItem;
  onToggle: (path: string) => void;
  onFileSelect: (path: string) => void;
  onFilePressIn?: (path: string) => void;
  colors: ColorTokens;
  searchMode?: boolean;
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
      onPressIn={() => {
        if (!isDir && onFilePressIn) onFilePressIn(node.path);
      }}
    >
      {isDir && !searchMode && (
        <Octicons
          name={isExpanded ? "chevron-down" : "chevron-right"}
          size={12}
          color={colors.textMuted}
        />
      )}

      <Octicons
        name={
          searchMode
            ? "file"
            : isDir
              ? isExpanded
                ? "file-directory-open-fill"
                : "file-directory-fill"
              : "file"
        }
        size={14}
        color={isDir && !searchMode ? colors.star : colors.textSecondary}
        style={!isDir || searchMode ? { marginLeft: 12 } : undefined}
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
        {searchMode ? node.path : node.name}
      </Text>
    </Pressable>
  );
});

export default function FileExplorerScreen() {
  const {
    repoId,
    path: targetPath,
    ref,
    refLabel,
  } = useLocalSearchParams<{
    repoId: string;
    path?: string;
    ref?: string;
    refLabel?: string;
  }>();
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const [owner, repoName] = decodeRepoId(repoId ?? "");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    if (!targetPath) return new Set<string>();
    const parts = targetPath.split("/");
    return new Set(parts.map((_, i) => parts.slice(0, i + 1).join("/")));
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const commonFilesPrefetched = useRef(false);
  const listRef = useRef<FlashListRef<FlatTreeItem>>(null);
  const [pendingScrollPath, setPendingScrollPath] = useState(targetPath);

  const { data: repo } = useRepo(owner, repoName);
  const { data: branches, isLoading: branchesLoading } = useBranches(owner, repoName);

  const selectedRef = selectedBranch || ref || repo?.default_branch || "";

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `${repo?.name ?? "Repository"} Files`,
      headerBackTitle: repo?.name ?? "Back",
    });
  }, [navigation, repo?.name]);

  const { data: fileTreeData, isLoading, error } = useFileTree(owner, repoName, selectedRef, true);

  useEffect(() => {
    if (fileTreeData?.tree && fileTreeData.tree.length > 0 && !commonFilesPrefetched.current) {
      commonFilesPrefetched.current = true;
      prefetchCommonFiles(queryClient, owner, repoName, fileTreeData.tree, selectedRef);
    }
  }, [fileTreeData, queryClient, owner, repoName, selectedRef]);

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
        pathname: "/(app)/repo/[repoId]/file",
        params: {
          repoId,
          path: encodeURIComponent(path),
          fileName: encodeURIComponent(fileName),
          ref: encodeURIComponent(selectedRef),
        },
      });
    },
    [router, repoId, selectedRef],
  );

  const handleFilePressIn = useCallback(
    (path: string) => {
      if (!owner || !repoName) return;
      prefetchFileContent(queryClient, owner, repoName, path, selectedRef);
    },
    [queryClient, owner, repoName, selectedRef],
  );

  const tree = useMemo(() => buildTree(fileTreeData?.tree ?? []), [fileTreeData?.tree]);

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

  const displayTree = useMemo(() => {
    if (searchQuery.length === 0) return flattenedTree;

    const query = searchQuery.toLowerCase();
    const results: FlatTreeItem[] = [];

    function traverse(nodes: TreeNode[]) {
      for (const node of nodes) {
        if (node.name.toLowerCase().includes(query) || node.path.toLowerCase().includes(query)) {
          results.push({ node, depth: 0, isExpanded: false });
        }
        if (node.children) traverse(node.children);
      }
    }

    traverse(tree);
    return results;
  }, [tree, flattenedTree, searchQuery]);

  useEffect(() => {
    if (!pendingScrollPath) return;
    const index = displayTree.findIndex((item) => item.node.path === pendingScrollPath);
    if (index === -1) return;
    listRef.current
      ?.scrollToIndex({ index, animated: true, viewPosition: 0.3 })
      .catch(() => console.error("Could not scroll to file"));
    const id = setTimeout(() => setPendingScrollPath(undefined), 0);
    return () => clearTimeout(id);
  }, [pendingScrollPath, displayTree]);

  const renderItem = useCallback(
    ({ item }: { item: FlatTreeItem }) => (
      <TreeItem
        item={item}
        onToggle={toggleFolder}
        onFileSelect={handleFileSelect}
        onFilePressIn={handleFilePressIn}
        colors={colors}
        searchMode={searchQuery.length > 0}
      />
    ),
    [toggleFolder, handleFileSelect, handleFilePressIn, colors, searchQuery],
  );

  const getItemType = useCallback(
    (item: FlatTreeItem) => (item.node.type === "tree" ? "folder" : "file"),
    [],
  );

  const s = useMemo(() => buildStyles(colors), [colors]);

  return (
    <SafeAreaView style={s.container} edges={["bottom"]}>
      <BranchSelector
        branches={branches ?? []}
        selectedBranch={selectedBranch || refLabel || selectedRef}
        onBranchChange={(branch) => {
          setSelectedBranch(branch);
          setExpandedPaths(new Set());
          setPendingScrollPath(undefined);
          setSearchQuery("");
          commonFilesPrefetched.current = false;
        }}
        isLoading={branchesLoading}
      />
      {error ? (
        <FileError title="Failed to load file tree" message={error.message} />
      ) : isLoading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator color={colors.accent} />
          <Text style={s.loadingText}>{`Loading ${repoName} file tree…`}</Text>
        </View>
      ) : flattenedTree.length === 0 ? (
        <View style={s.loadingContainer}>
          <Text style={s.loadingText}>No files found</Text>
        </View>
      ) : displayTree.length === 0 ? (
        <View style={s.loadingContainer}>
          <Text style={s.loadingText}>No results for &ldquo;{searchQuery}&rdquo;</Text>
        </View>
      ) : (
        <FlashList
          ref={listRef}
          data={displayTree}
          renderItem={renderItem}
          getItemType={getItemType}
          keyExtractor={(item) => item.node.path}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Spacing.lg,
          }}
          ListHeaderComponent={
            <View
              style={{
                paddingHorizontal: Spacing.md,
                paddingTop: Spacing.sm,
                paddingBottom: Spacing.xs,
              }}
            >
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search files…"
              />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function buildStyles(colors: ColorTokens) {
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
