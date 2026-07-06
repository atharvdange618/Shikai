import React from "react";

import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { themes, type ThemeName } from "./constants/themes";
import { mmkv } from "./lib/mmkv";
import { fetchContributionsForWidget } from "./lib/widget-data";
import { colorsForTheme } from "./lib/widget-refresh";
import { ContributionWidget } from "./widgets/ContributionWidget";

const THEME_MMKV_KEY = "shikai-theme";

function getWidgetColors() {
  const stored = mmkv.getString(THEME_MMKV_KEY);
  const themeName: ThemeName =
    stored && stored in themes ? (stored as ThemeName) : "dark";
  return colorsForTheme(themeName);
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;

  if (widgetInfo.widgetName !== "ContributionGraph") return;

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE": {
      const [data, themeColors] = await Promise.all([
        fetchContributionsForWidget(),
        Promise.resolve(getWidgetColors()),
      ]);

      props.renderWidget(
        <ContributionWidget
          totalContributions={data?.totalContributions ?? 0}
          weeks={data?.weeks ?? []}
          currentStreak={data?.currentStreak ?? 0}
          longestStreak={data?.longestStreak ?? 0}
          themeColors={themeColors}
          widgetWidth={widgetInfo.width}
          widgetHeight={widgetInfo.height}
        />,
      );
      break;
    }
    case "WIDGET_RESIZED":
    case "WIDGET_DELETED":
    case "WIDGET_CLICK":
    default:
      break;
  }
}
