import React from "react";

import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { fetchContributionsForWidget } from "./lib/widget-data";
import { ContributionWidget } from "./widgets/ContributionWidget";

const nameToWidget: Record<
  string,
  React.FC<{
    totalContributions: number;
    weeks: import("./lib/widget-data").WidgetContributionWeek[];
    currentStreak: number;
    longestStreak: number;
    widgetWidth?: number;
    widgetHeight?: number;
  }>
> = {
  ContributionGraph: ContributionWidget,
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const Widget =
    nameToWidget[widgetInfo.widgetName as keyof typeof nameToWidget];

  if (!Widget) return;

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE": {
      const data = await fetchContributionsForWidget();
      if (data) {
        props.renderWidget(
          <Widget
            totalContributions={data.totalContributions}
            weeks={data.weeks}
            currentStreak={data.currentStreak}
            longestStreak={data.longestStreak}
            widgetWidth={widgetInfo.width}
            widgetHeight={widgetInfo.height}
          />,
        );
      } else {
        props.renderWidget(
          <Widget
            totalContributions={0}
            weeks={[]}
            currentStreak={0}
            longestStreak={0}
            widgetWidth={widgetInfo.width}
            widgetHeight={widgetInfo.height}
          />,
        );
      }
      break;
    }
    case "WIDGET_RESIZED":
      break;
    case "WIDGET_DELETED":
      break;
    case "WIDGET_CLICK":
      break;
    default:
      break;
  }
}
