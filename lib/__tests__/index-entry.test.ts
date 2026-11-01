import { describe, expect, it, vi } from "vitest";

// index.ts is what Android runs for a headless WorkManager wake, where
// app/_layout.tsx never loads. Sentry has to start here, or poller errors
// never reach it (D-030).
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
