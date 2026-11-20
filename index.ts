import "expo-router/entry";

import { registerWidgetTaskHandler } from "react-native-android-widget";

import { initSentry } from "./lib/sentry";
import { widgetTaskHandler } from "./widgets/widget-task-handler";
import "./lib/background-notifications";

initSentry();

registerWidgetTaskHandler(widgetTaskHandler);
