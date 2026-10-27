import { Stack } from "expo-router";

import { FontFamily, FontSize, useTheme } from "@/constants/theme";

const SCREEN_TITLES = {
  "[repoId]/index": "",
  "[repoId]/commits": "Commits",
  "[repoId]/stargazers": "Stargazers",
  "[repoId]/forks": "Forks",
  "[repoId]/files": "Files",
  "[repoId]/file": "",
  "[repoId]/issues": "Issues",
  "[repoId]/pull-requests": "Pull Requests",
  "[repoId]/issue/[number]": "",
  "[repoId]/pr/[number]": "",
  "[repoId]/commit/[sha]": "",
  "[repoId]/blame": "",
  "[repoId]/checks/[runId]": "",
  "[repoId]/actions": "Actions",
  "[repoId]/run/[runId]": "",
  "[repoId]/compare": "Compare",
  "[repoId]/releases": "Releases",
  "[repoId]/insights": "Insights",
  "[repoId]/discussions": "Discussions",
  "[repoId]/discussion/[number]": "",
  "[repoId]/release/[tag]": "",
};

export default function RepoLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontFamily: FontFamily.semiBold,
          fontSize: FontSize.title,
          color: colors.textPrimary,
        },
        headerTintColor: colors.accent,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        headerBackTitle: "",
      }}
    >
      {Object.entries(SCREEN_TITLES).map(([name, title]) => (
        <Stack.Screen key={name} name={name} options={{ title }} />
      ))}
    </Stack>
  );
}
