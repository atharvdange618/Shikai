import { describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => [] as string[]);

vi.mock("expo-router/entry", () => ({}));
vi.mock("react-native-android-widget", () => ({
  registerWidgetTaskHandler: () => calls.push("registerWidgetTaskHandler"),
}));
vi.mock("@/widgets/widget-task-handler", () => ({ widgetTaskHandler: vi.fn() }));
vi.mock("@/lib/background-notifications", () => ({}));
vi.mock("@/lib/sentry", () => ({ initSentry: () => calls.push("initSentry") }));

describe("index.ts entry", () => {
  it("starts Sentry once, before registering the widget task handler", async () => {
    await import("@/index");
    expect(calls).toEqual(["initSentry", "registerWidgetTaskHandler"]);
  });
});
