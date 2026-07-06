import React from "react";

import { requestWidgetUpdate } from "react-native-android-widget";
import { themes, type ThemeName } from "../constants/themes";
import {
  ContributionWidget,
  type WidgetThemeColors,
} from "../widgets/ContributionWidget";
import { fetchContributionsForWidget } from "./widget-data";

export function colorsForTheme(themeName: ThemeName): WidgetThemeColors {
  const { colors: c } = themes[themeName];
  return {
    bg: c.surface as `#${string}`,
    text: c.textPrimary as `#${string}`,
    muted: c.textMuted as `#${string}`,
    empty: c.contributeEmpty as `#${string}`,
    l1: c.contributeL1 as `#${string}`,
    l2: c.contributeL2 as `#${string}`,
    l3: c.contributeL3 as `#${string}`,
    l4: c.contributeL4 as `#${string}`,
  };
}

/**
 * Push updated widget colours immediately when the user changes their theme.
 * Safe to call from any screen — does not depend on the headless task context.
 */
export async function refreshWidgetTheme(themeName: ThemeName): Promise<void> {
  const themeColors = colorsForTheme(themeName);
  const data = await fetchContributionsForWidget();

  await requestWidgetUpdate({
    widgetName: "ContributionGraph",
    widgetNotFound: () => {},
    renderWidget: (widgetInfo) => (
      <ContributionWidget
        totalContributions={data?.totalContributions ?? 0}
        weeks={data?.weeks ?? []}
        currentStreak={data?.currentStreak ?? 0}
        longestStreak={data?.longestStreak ?? 0}
        themeColors={themeColors}
        widgetWidth={widgetInfo.width}
        widgetHeight={widgetInfo.height}
      />
    ),
  });
}
