import { useColorScheme } from "react-native";

export const FontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",

  mono: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
} as const;

export const FontSize = {
  display: 28,
  heading: 22,
  title: 18,
  body: 15,
  label: 13,
  caption: 11,
} as const;

export const FontWeight = {
  regular: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;

export const TextStyles = {
  display: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.display,
    lineHeight: FontSize.display * LineHeight.tight,
  },
  heading: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.heading,
    lineHeight: FontSize.heading * LineHeight.tight,
  },
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.title,
    lineHeight: FontSize.title * LineHeight.tight,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    lineHeight: FontSize.body * LineHeight.normal,
  },
  bodyMedium: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body,
    lineHeight: FontSize.body * LineHeight.normal,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.label,
    lineHeight: FontSize.label * LineHeight.normal,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    lineHeight: FontSize.caption * LineHeight.normal,
  },
  mono: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.label,
    lineHeight: FontSize.label * LineHeight.normal,
  },
  monoCaption: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.caption,
    lineHeight: FontSize.caption * LineHeight.normal,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  "3xl": 48,
  "4xl": 64,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const BorderWidth = {
  thin: 0.5,
  normal: 1,
  thick: 1.5,
} as const;

const Palette = {
  warmWhite: "#FAF9F6",
  beige50: "#F8F6F0",
  beige100: "#F5F1E8",
  beige200: "#EBE6DC",
  beige300: "#D9D3C7",

  blue50: "#EFF6FF",
  blue100: "#DBEAFE",
  blue300: "#93C5FD",
  blue500: "#3B82F6",
  blue600: "#2563EB",
  blue700: "#1D4ED8",

  githubBlue: "#58A6FF",

  green100: "#DCFCE7",
  green300: "#86EFAC",
  green400: "#4ADE80",
  green500: "#22C55E",
  green700: "#15803D",

  contributeL0: "#161B22",
  contributeL1: "#0E4429",
  contributeL2: "#006D32",
  contributeL3: "#26A641",
  contributeL4: "#39D353",

  contributeL0Light: "#EBEDF0",
  contributeL1Light: "#9BE9A8",
  contributeL2Light: "#40C463",
  contributeL3Light: "#30A14E",
  contributeL4Light: "#216E39",

  red400: "#F87171",
  red500: "#EF4444",
  red600: "#DC2626",

  orange400: "#FB923C",
  orange500: "#F97316",

  purple500: "#A855F7",

  yellow400: "#FACC15",
  yellow500: "#EAB308",

  white: "#F5F5F5",
  gray50: "#F8FAFC",
  gray100: "#F0F4F8",
  gray200: "#E2EAF1",
  gray300: "#C8D6E3",
  gray400: "#98A9B8",
  gray500: "#5A6B7B",
  gray600: "#3D4F5E",
  gray700: "#2A3A47",
  gray800: "#1A2332",
  gray900: "#0F1923",

  dark900: "#0D1117",
  dark800: "#161B22",
  dark700: "#1C2128",
  dark600: "#21262D",
  dark500: "#30363D",
  dark400: "#484F58",
  dark300: "#6E7681",
  dark200: "#8B949E",
  dark100: "#C9D1D9",
  dark50: "#E6EDF3",
} as const;

export const LightColors = {
  background: Palette.warmWhite,
  backgroundSubtle: Palette.beige50,

  surface: Palette.warmWhite,
  surfaceSecondary: Palette.beige200,
  surfaceInset: Palette.beige100,

  border: Palette.beige300,
  borderSubtle: Palette.beige200,

  accent: Palette.blue500,
  accentSubtle: Palette.blue100,
  accentMuted: Palette.blue300,

  textPrimary: Palette.gray800,
  textSecondary: Palette.gray500,
  textMuted: Palette.gray400,
  textOnAccent: Palette.white,
  textLink: Palette.blue600,

  success: Palette.green500,
  successSubtle: Palette.green100,
  danger: Palette.red500,
  dangerSubtle: "#FEE2E2",
  warning: Palette.orange500,
  warningSubtle: "#FFF7ED",
  merged: Palette.purple500,

  badgePublicBg: Palette.green100,
  badgePublicText: Palette.green700,
  badgePrivateBg: Palette.gray200,
  badgePrivateText: Palette.gray600,
  badgeForkBg: Palette.blue100,
  badgeForkText: Palette.blue700,

  star: Palette.yellow500,

  contributeEmpty: Palette.contributeL0Light,
  contributeL1: Palette.contributeL1Light,
  contributeL2: Palette.contributeL2Light,
  contributeL3: Palette.contributeL3Light,
  contributeL4: Palette.contributeL4Light,

  tabBarBackground: Palette.warmWhite,
  tabBarBorder: Palette.beige300,
  tabBarActive: Palette.blue500,
  tabBarInactive: Palette.gray400,
} as const;

export const DarkColors = {
  background: Palette.dark900,
  backgroundSubtle: "#0A0D12",

  surface: Palette.dark800,
  surfaceSecondary: Palette.dark700,
  surfaceInset: Palette.dark600,

  border: Palette.dark500,
  borderSubtle: "#21262D",

  accent: Palette.githubBlue,
  accentSubtle: "#1C2D3F",
  accentMuted: "#2D4464",

  textPrimary: Palette.dark50,
  textSecondary: Palette.dark200,
  textMuted: Palette.dark300,
  textOnAccent: Palette.dark900,
  textLink: Palette.githubBlue,

  success: Palette.green400,
  successSubtle: "#0C2D1A",
  danger: "#F85149",
  dangerSubtle: "#2D1217",
  warning: Palette.orange400,
  warningSubtle: "#2D1B00",
  merged: "#A371F7",

  badgePublicBg: "#0C2D1A",
  badgePublicText: Palette.green400,
  badgePrivateBg: Palette.dark600,
  badgePrivateText: Palette.dark200,
  badgeForkBg: "#1C2D3F",
  badgeForkText: Palette.githubBlue,

  star: Palette.yellow400,

  contributeEmpty: Palette.contributeL0,
  contributeL1: Palette.contributeL1,
  contributeL2: Palette.contributeL2,
  contributeL3: Palette.contributeL3,
  contributeL4: Palette.contributeL4,

  tabBarBackground: Palette.dark800,
  tabBarBorder: Palette.dark500,
  tabBarActive: Palette.githubBlue,
  tabBarInactive: Palette.dark300,
} as const;

export type ColorTokens = typeof LightColors | typeof DarkColors;

export const Shadows = {
  light: {
    sm: {
      shadowColor: Palette.gray800,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: Palette.gray800,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: Palette.gray800,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
  },
  dark: {
    sm: {},
    md: {},
    lg: {},
  },
} as const;

export const ZIndex = {
  base: 0,
  raised: 10,
  overlay: 20,
  modal: 30,
  toast: 40,
  tooltip: 50,
} as const;

export const IconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  xxl: 32,
} as const;

export const AvatarSize = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 72,
  xl: 96,
} as const;

export const Duration = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 450,
  crawl: 600,
} as const;

export const Easing = {
  standard: "easeInOut",
  decelerate: "easeOut",
  accelerate: "easeIn",
  spring: "spring",
} as const;

export const Layout = {
  screenPadding: Spacing.lg,

  tabBarHeight: 60,

  repoCardHeight: 148,

  commitItemHeight: 72,

  heatmapCellSize: 11,
  heatmapCellGap: 2,

  readmeMaxWidth: 680,
} as const;

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const colors: ColorTokens = isDark ? DarkColors : LightColors;
  const shadows = isDark ? Shadows.dark : Shadows.light;

  return {
    isDark,
    colors,
    shadows,
    spacing: Spacing,
    typography: TextStyles,
    fontSize: FontSize,
    fontFamily: FontFamily,
    fontWeight: FontWeight,
    lineHeight: LineHeight,
    radius: Radius,
    border: BorderWidth,
    iconSize: IconSize,
    avatarSize: AvatarSize,
    zIndex: ZIndex,
    duration: Duration,
    layout: Layout,
  } as const;
}

export const StaticTheme = {
  light: {
    colors: LightColors,
    shadows: Shadows.light,
  },
  dark: {
    colors: DarkColors,
    shadows: Shadows.dark,
  },
  spacing: Spacing,
  typography: TextStyles,
  fontSize: FontSize,
  fontFamily: FontFamily,
  fontWeight: FontWeight,
  lineHeight: LineHeight,
  radius: Radius,
  border: BorderWidth,
  iconSize: IconSize,
  avatarSize: AvatarSize,
  zIndex: ZIndex,
  duration: Duration,
  layout: Layout,
} as const;
