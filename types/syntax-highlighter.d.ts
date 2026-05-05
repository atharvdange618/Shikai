declare module "react-native-syntax-highlighter" {
  import { ComponentType } from "react";

  interface SyntaxHighlighterProps {
    language?: string;
    style?: Record<string, unknown>;
    customStyle?: Record<string, unknown>;
    PreTag?: ComponentType<any>;
    CodeTag?: ComponentType<any>;
    fontSize?: number;
    highlighter?: string;
    fontFamily?: string;
    children: string;
  }

  export default function SyntaxHighlighter(
    props: SyntaxHighlighterProps,
  ): JSX.Element;
}

declare module "react-syntax-highlighter/dist/esm/styles/prism" {
  export const atomDark: Record<string, unknown>;
  export const ghcolors: Record<string, unknown>;
  export const vscDarkPlus: Record<string, unknown>;
  export const prism: Record<string, unknown>;
  export const okaidia: Record<string, unknown>;
  export const twilight: Record<string, unknown>;
  export const tomorrow: Record<string, unknown>;
  export const solarizedlight: Record<string, unknown>;
}
