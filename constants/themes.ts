export type ThemeName = "light" | "dark" | "tokyo-night" | "dracula" | "atom-one-dark";

export interface ColorTokens {
  background: string;
  backgroundSubtle: string;

  surface: string;
  surfaceSecondary: string;
  surfaceInset: string;

  border: string;
  borderSubtle: string;

  accent: string;
  accentSubtle: string;
  accentMuted: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnAccent: string;
  textLink: string;

  success: string;
  successSubtle: string;
  danger: string;
  dangerSubtle: string;
  warning: string;
  warningSubtle: string;
  merged: string;

  badgePublicBg: string;
  badgePublicText: string;
  badgePrivateBg: string;
  badgePrivateText: string;
  badgeForkBg: string;
  badgeForkText: string;

  star: string;

  contributeEmpty: string;
  contributeL1: string;
  contributeL2: string;
  contributeL3: string;
  contributeL4: string;

  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export interface Theme {
  name: ThemeName;
  label: string;
  isDark: boolean;
  colors: ColorTokens;
}

const Light: Theme = {
  name: "light",
  label: "Light",
  isDark: false,
  colors: {
    background: "#FAF9F6",
    backgroundSubtle: "#F8F6F0",

    surface: "#FAF9F6",
    surfaceSecondary: "#EBE6DC",
    surfaceInset: "#F5F1E8",

    border: "#D9D3C7",
    borderSubtle: "#EBE6DC",

    accent: "#3B82F6",
    accentSubtle: "#DBEAFE",
    accentMuted: "#93C5FD",

    textPrimary: "#1A2332",
    textSecondary: "#5A6B7B",
    textMuted: "#98A9B8",
    textOnAccent: "#F5F5F5",
    textLink: "#2563EB",

    success: "#22C55E",
    successSubtle: "#DCFCE7",
    danger: "#EF4444",
    dangerSubtle: "#FEE2E2",
    warning: "#F97316",
    warningSubtle: "#FFF7ED",
    merged: "#A855F7",

    badgePublicBg: "#DCFCE7",
    badgePublicText: "#15803D",
    badgePrivateBg: "#E2EAF1",
    badgePrivateText: "#3D4F5E",
    badgeForkBg: "#DBEAFE",
    badgeForkText: "#1D4ED8",

    star: "#EAB308",

    contributeEmpty: "#EBEDF0",
    contributeL1: "#9BE9A8",
    contributeL2: "#40C463",
    contributeL3: "#30A14E",
    contributeL4: "#216E39",

    tabBarBackground: "#FAF9F6",
    tabBarBorder: "#D9D3C7",
    tabBarActive: "#3B82F6",
    tabBarInactive: "#98A9B8",
  },
};

const Dark: Theme = {
  name: "dark",
  label: "Dark",
  isDark: true,
  colors: {
    background: "#0D1117",
    backgroundSubtle: "#0A0D12",

    surface: "#161B22",
    surfaceSecondary: "#1C2128",
    surfaceInset: "#21262D",

    border: "#30363D",
    borderSubtle: "#21262D",

    accent: "#58A6FF",
    accentSubtle: "#1C2D3F",
    accentMuted: "#2D4464",

    textPrimary: "#E6EDF3",
    textSecondary: "#8B949E",
    textMuted: "#6E7681",
    textOnAccent: "#0D1117",
    textLink: "#58A6FF",

    success: "#4ADE80",
    successSubtle: "#0C2D1A",
    danger: "#F85149",
    dangerSubtle: "#2D1217",
    warning: "#FB923C",
    warningSubtle: "#2D1B00",
    merged: "#A371F7",

    badgePublicBg: "#0C2D1A",
    badgePublicText: "#4ADE80",
    badgePrivateBg: "#21262D",
    badgePrivateText: "#8B949E",
    badgeForkBg: "#1C2D3F",
    badgeForkText: "#58A6FF",

    star: "#FACC15",

    contributeEmpty: "#161B22",
    contributeL1: "#0E4429",
    contributeL2: "#006D32",
    contributeL3: "#26A641",
    contributeL4: "#39D353",

    tabBarBackground: "#161B22",
    tabBarBorder: "#30363D",
    tabBarActive: "#58A6FF",
    tabBarInactive: "#6E7681",
  },
};

const TokyoNight: Theme = {
  name: "tokyo-night",
  label: "Tokyo Night",
  isDark: true,
  colors: {
    background: "#1A1B26",
    backgroundSubtle: "#16161E",

    surface: "#1F2335",
    surfaceSecondary: "#292E42",
    surfaceInset: "#32384C",

    border: "#3B4261",
    borderSubtle: "#303650",

    accent: "#7AA2F7",
    accentSubtle: "#1E2640",
    accentMuted: "#2E4470",

    textPrimary: "#C0CAF5",
    textSecondary: "#A9B1D6",
    textMuted: "#565F89",
    textOnAccent: "#1A1B26",
    textLink: "#7AA2F7",

    success: "#9ECE6A",
    successSubtle: "#1A2B18",
    danger: "#F7768E",
    dangerSubtle: "#2B1A24",
    warning: "#E0AF68",
    warningSubtle: "#2B2818",
    merged: "#BB9AF7",

    badgePublicBg: "#1A2B18",
    badgePublicText: "#9ECE6A",
    badgePrivateBg: "#292E42",
    badgePrivateText: "#A9B1D6",
    badgeForkBg: "#1E2640",
    badgeForkText: "#7AA2F7",

    star: "#E0AF68",

    contributeEmpty: "#1F2335",
    contributeL1: "#1D2B4A",
    contributeL2: "#2A3E6E",
    contributeL3: "#3A5A98",
    contributeL4: "#5A8AE8",

    tabBarBackground: "#1F2335",
    tabBarBorder: "#3B4261",
    tabBarActive: "#7AA2F7",
    tabBarInactive: "#565F89",
  },
};

const Dracula: Theme = {
  name: "dracula",
  label: "Dracula",
  isDark: true,
  colors: {
    background: "#282A36",
    backgroundSubtle: "#21222C",

    surface: "#343746",
    surfaceSecondary: "#44475A",
    surfaceInset: "#4D5066",

    border: "#6272A4",
    borderSubtle: "#555A78",

    accent: "#BD93F9",
    accentSubtle: "#332E52",
    accentMuted: "#4A3E82",

    textPrimary: "#F8F8F2",
    textSecondary: "#E2E2DB",
    textMuted: "#6272A4",
    textOnAccent: "#282A36",
    textLink: "#BD93F9",

    success: "#50FA7B",
    successSubtle: "#1A3020",
    danger: "#FF5555",
    dangerSubtle: "#3A1820",
    warning: "#F1FA8C",
    warningSubtle: "#3A3820",
    merged: "#FF79C6",

    badgePublicBg: "#1A3020",
    badgePublicText: "#50FA7B",
    badgePrivateBg: "#44475A",
    badgePrivateText: "#F8F8F2",
    badgeForkBg: "#332E52",
    badgeForkText: "#BD93F9",

    star: "#F1FA8C",

    contributeEmpty: "#343746",
    contributeL1: "#42265E",
    contributeL2: "#622E82",
    contributeL3: "#82369E",
    contributeL4: "#BD40C0",

    tabBarBackground: "#343746",
    tabBarBorder: "#6272A4",
    tabBarActive: "#BD93F9",
    tabBarInactive: "#6272A4",
  },
};

const AtomOneDark: Theme = {
  name: "atom-one-dark",
  label: "Atom One Dark",
  isDark: true,
  colors: {
    background: "#282C34",
    backgroundSubtle: "#21252B",

    surface: "#21252B",
    surfaceSecondary: "#2C313C",
    surfaceInset: "#333844",

    border: "#4B5263",
    borderSubtle: "#3E4452",

    accent: "#61AFEF",
    accentSubtle: "#232E3C",
    accentMuted: "#3A5A82",

    textPrimary: "#E6E6E6",
    textSecondary: "#ABB2BF",
    textMuted: "#636D83",
    textOnAccent: "#282C34",
    textLink: "#61AFEF",

    success: "#98C379",
    successSubtle: "#1E2E1A",
    danger: "#E06C75",
    dangerSubtle: "#2E1A1E",
    warning: "#E5C07B",
    warningSubtle: "#2E2818",
    merged: "#C678DD",

    badgePublicBg: "#1E2E1A",
    badgePublicText: "#98C379",
    badgePrivateBg: "#2C313C",
    badgePrivateText: "#ABB2BF",
    badgeForkBg: "#232E3C",
    badgeForkText: "#61AFEF",

    star: "#E5C07B",

    contributeEmpty: "#21252B",
    contributeL1: "#2A3A24",
    contributeL2: "#3E5E34",
    contributeL3: "#5A8A4A",
    contributeL4: "#7AB864",

    tabBarBackground: "#21252B",
    tabBarBorder: "#4B5263",
    tabBarActive: "#61AFEF",
    tabBarInactive: "#636D83",
  },
};

export const themes: Record<ThemeName, Theme> = {
  light: Light,
  dark: Dark,
  "tokyo-night": TokyoNight,
  dracula: Dracula,
  "atom-one-dark": AtomOneDark,
};

export const themeList: Theme[] = [Light, Dark, TokyoNight, Dracula, AtomOneDark];
