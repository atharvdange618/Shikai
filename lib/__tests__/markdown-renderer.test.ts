import { createElement, isValidElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  post: vi.fn<() => Promise<{ data: string }>>(),
  response: undefined as unknown,
}));

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useCallback: <T>(callback: T) => callback,
  useEffect: (effect: () => void) => effect(),
  useMemo: <T>(compute: () => T) => compute(),
  useState: (initial: unknown) => {
    if (typeof initial === "function") return [{ setValue: vi.fn() }, vi.fn()];
    if (typeof initial === "number") return [initial, vi.fn()];
    return [
      m.response ?? initial,
      (value: unknown) => {
        m.response = value;
      },
    ];
  },
}));
vi.mock("@/constants/theme", () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock("@/lib/axios", () => ({ githubAxios: { post: m.post } }));
vi.mock("expo-clipboard", () => ({}));
vi.mock("expo-router", () => ({ useRouter: () => ({}) }));
vi.mock("react-native", () => ({
  Animated: { View: "AnimatedView" },
  Linking: {},
  StyleSheet: { create: <T>(styles: T) => styles },
}));
vi.mock("react-native-webview", () => ({ WebView: "WebView" }));

import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

function renderedHtml(markdown: string): string | undefined {
  const result: unknown = MarkdownRenderer({ markdown });
  if (!isValidElement<{ children: unknown }>(result)) return;
  const child = result.props.children;
  if (!isValidElement<{ source?: { html: string } }>(child)) return;
  return child.props.source?.html;
}

describe("MarkdownRenderer", () => {
  beforeEach(() => vi.stubGlobal("React", { createElement }));
  afterEach(() => vi.unstubAllGlobals());

  it("shows a local diagram while GitHub is pending and uses GitHub HTML on success", async () => {
    const request = Promise.withResolvers<{ data: string }>();
    m.post.mockReturnValue(request.promise);
    const markdown = "# Local heading\n\n```mermaid\nflowchart LR\n  A --> B\n```";

    expect(renderedHtml(markdown) ?? "").toContain("pele-flowchart");
    expect(m.post).toHaveBeenCalledOnce();

    request.resolve({ data: "<h1>GitHub heading</h1>" });
    await request.promise;

    expect(renderedHtml(markdown)).toContain("<h1>GitHub heading</h1>");
    expect(renderedHtml("# Another document")).toContain("# Another document");
  });
});
