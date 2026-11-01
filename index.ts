import "expo-router/entry";

import { registerWidgetTaskHandler } from "react-native-android-widget";

import { initSentry } from "./lib/sentry";
import { widgetTaskHandler } from "./widgets/widget-task-handler";
// Defines the background alerts task; has to load before WorkManager runs it.
import "./lib/background-notifications";

// Here and not in app/_layout.tsx: a headless WorkManager run never loads the
// layout, so poller errors would otherwise never reach Sentry (D-030).
initSentry();

registerWidgetTaskHandler(widgetTaskHandler);
