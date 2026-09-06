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
  version: "1.4.0",
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
    versionCode: 5,
    // No autoVerify: Shikai just shows up in the chooser for github.com links.
    intentFilters: [
      {
        action: "VIEW",
        category: ["BROWSABLE", "DEFAULT"],
        data: [
          { scheme: "https", host: "github.com" },
          { scheme: "https", host: "www.github.com" },
        ],
      },
    ],
  },
  web: {
    output: "static",
    favicon: "./assets/images/icon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    // Puts Shikai in the Android share sheet for text/URL shares. This is the
    // path that actually works: github.com verified app links send taps
    // straight to the GitHub app, but a shared link comes through here.
    "expo-share-intent",
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
    "./plugins/withGradleProperties",
    ["react-native-android-widget", widgetConfig],
    [
      "@sentry/react-native/expo",
      {
        // EU region: the merc-with-a-mouth org lives on de.sentry.io.
        url: "https://de.sentry.io/",
        organization: "merc-with-a-mouth",
        project: "shikai",
      },
    ],
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
