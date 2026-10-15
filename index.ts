import "expo-router/entry";

import { registerWidgetTaskHandler } from "react-native-android-widget";

import { widgetTaskHandler } from "./widgets/widget-task-handler";
// Defines the background alerts task; has to load before WorkManager runs it.
import "./lib/background-notifications";

registerWidgetTaskHandler(widgetTaskHandler);
