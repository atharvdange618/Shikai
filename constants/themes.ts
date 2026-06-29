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
    background: "#141824",
    backgroundSubtle: "#101420",

    surface: "#1A1E34",
    surfaceSecondary: "#262B48",
    surfaceInset: "#2A2F50",

    border: "#384070",
    borderSubtle: "#2E3660",

    accent: "#7AA2F7",
    accentSubtle: "#1C2D4A",
    accentMuted: "#2E4A7A",

    textPrimary: "#E4ECFF",
    textSecondary: "#B4C0E8",
    textMuted: "#5460A0",
    textOnAccent: "#141824",
    textLink: "#7AA2F7",

    success: "#9ECE6A",
    successSubtle: "#1A2E14",
    danger: "#F7768E",
    dangerSubtle: "#2E1A22",
    warning: "#E0AF68",
    warningSubtle: "#2E2A14",
    merged: "#BB9AF7",

    badgePublicBg: "#1A2E14",
    badgePublicText: "#9ECE6A",
    badgePrivateBg: "#262B48",
    badgePrivateText: "#B4C0E8",
    badgeForkBg: "#1C2D4A",
    badgeForkText: "#7AA2F7",

    star: "#E0AF68",

    contributeEmpty: "#1A1E34",
    contributeL1: "#1A2848",
    contributeL2: "#2A3E70",
    contributeL3: "#3A5A9A",
    contributeL4: "#5A8AE8",

    tabBarBackground: "#1A1E34",
    tabBarBorder: "#384070",
    tabBarActive: "#7AA2F7",
    tabBarInactive: "#5460A0",
  },
};

const Dracula: Theme = {
  name: "dracula",
  label: "Dracula",
  isDark: true,
  colors: {
    background: "#202238",
    backgroundSubtle: "#1A1C30",

    surface: "#2C2F48",
    surfaceSecondary: "#3C4060",
    surfaceInset: "#404468",

    border: "#6068A8",
    borderSubtle: "#505890",

    accent: "#C49BFF",
    accentSubtle: "#2E2848",
    accentMuted: "#4E3E78",

    textPrimary: "#FFFFFF",
    textSecondary: "#D8D8EC",
    textMuted: "#8890B8",
    textOnAccent: "#202238",
    textLink: "#C49BFF",

    success: "#6BFF96",
    successSubtle: "#1A3020",
    danger: "#FF4444",
    dangerSubtle: "#3A1820",
    warning: "#FFFA70",
    warningSubtle: "#3A3820",
    merged: "#FF85D0",

    badgePublicBg: "#1A3020",
    badgePublicText: "#6BFF96",
    badgePrivateBg: "#3C4060",
    badgePrivateText: "#D8D8EC",
    badgeForkBg: "#2E2848",
    badgeForkText: "#C49BFF",

    star: "#FFFA70",

    contributeEmpty: "#2C2F48",
    contributeL1: "#342858",
    contributeL2: "#4A3878",
    contributeL3: "#604898",
    contributeL4: "#8058C0",

    tabBarBackground: "#2C2F48",
    tabBarBorder: "#6068A8",
    tabBarActive: "#C49BFF",
    tabBarInactive: "#8890B8",
  },
};

const AtomOneDark: Theme = {
  name: "atom-one-dark",
  label: "Atom One Dark",
  isDark: true,
  colors: {
    background: "#1C2030",
    backgroundSubtle: "#161A28",

    surface: "#161A28",
    surfaceSecondary: "#242840",
    surfaceInset: "#282C48",

    border: "#3A4060",
    borderSubtle: "#323858",

    accent: "#4EA9FF",
    accentSubtle: "#1C2840",
    accentMuted: "#2A3E68",

    textPrimary: "#E8ECFA",
    textSecondary: "#A8B0D4",
    textMuted: "#606888",
    textOnAccent: "#1C2030",
    textLink: "#4EA9FF",

    success: "#7ED67E",
    successSubtle: "#1A2E1A",
    danger: "#FF6B7A",
    dangerSubtle: "#2E1820",
    warning: "#FFD76E",
    warningSubtle: "#2E2A18",
    merged: "#D48CFF",

    badgePublicBg: "#1A2E1A",
    badgePublicText: "#7ED67E",
    badgePrivateBg: "#242840",
    badgePrivateText: "#A8B0D4",
    badgeForkBg: "#1C2840",
    badgeForkText: "#4EA9FF",

    star: "#FFD76E",

    contributeEmpty: "#161A28",
    contributeL1: "#1A2848",
    contributeL2: "#2A3E70",
    contributeL3: "#3A5A9A",
    contributeL4: "#4A80D0",

    tabBarBackground: "#161A28",
    tabBarBorder: "#3A4060",
    tabBarActive: "#4EA9FF",
    tabBarInactive: "#606888",
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
