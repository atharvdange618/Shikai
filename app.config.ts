import type { ConfigContext, ExpoConfig } from "expo/config";

import type { WithAndroidWidgetsParams } from "react-native-android-widget";

const widgetConfig: WithAndroidWidgetsParams = {
  fonts: ["./assets/fonts/Inter.ttf"],
  widgets: [
    {
      name: "ContributionGraph",
      label: "GitHub Streak",
      minWidth: "250dp",
      minHeight: "110dp",
      targetCellWidth: 4,
      targetCellHeight: 2,
      description: "Your GitHub contribution streak and activity graph",
      previewImage: "./assets/widget-preview/contribution.png",
      updatePeriodMillis: 30 * 60 * 1000,
    },
  ],
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Shikai",
  slug: "shikai",
  version: "1.3.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "shikai",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.atharvdange618.Shikai",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#FAF9F6",
      foregroundImage: "./assets/images/adaptive-icon.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.atharvdange618.Shikai",
  },
  web: {
    output: "static",
    favicon: "./assets/images/icon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#FAF9F6",
        dark: {
          image: "./assets/images/splash-icon-dark.png",
          backgroundColor: "#0D1117",
        },
      },
    ],
    "expo-web-browser",
    "expo-updates",
    "./plugins/withAndroidPackaging",
    ["react-native-android-widget", widgetConfig],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "391eb75d-56e7-4c27-8e1b-5d20e3d75ba9",
    },
  },
  owner: "atharvdange618",
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: "https://u.expo.dev/391eb75d-56e7-4c27-8e1b-5d20e3d75ba9",
  },
});
