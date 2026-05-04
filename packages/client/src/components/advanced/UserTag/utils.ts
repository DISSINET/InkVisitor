import { IResponseUser } from "@shared/types/response-user";
import { ThemeType } from "Theme/theme";

// ----------- VARIANTS DESCRIPTION ------------
// bordered: border, inverted background
// light: border, invertedBg background color (from theme)
// filled: no border
// inverted: no border, inverted background (text and background are exchanged)
// transparent: no border, no background
// dark: dark background without theming
// bright: bright background without theming

export type UserTagVariant =
  | "bordered"
  | "light"
  | "filled"
  | "inverted"
  | "transparent"
  | "dark"
  | "bright";
export enum UserTagSize {
  Small = "S",
  Medium = "M",
  Large = "L",
  ExtraLarge = "XL",
}
export type UserTagColor = "primary" | "success" | "warning" | "danger" | "info";

const STATIC_DARK = "#091034"; // theme.color.primary
const STATIC_BRIGHT = "#ffffff"; // theme.color.white

export const getUserLabel = (user: IResponseUser | undefined, userId: string): string => {
  if (!user) return userId;
  return user.name || user.email || user.id || userId;
};

const toInvertedBgKey = (color: UserTagColor): keyof ThemeType["color"]["invertedBg"] => {
  const map: Record<UserTagColor, keyof ThemeType["color"]["invertedBg"]> = {
    primary: "primary",
    success: "success",
    warning: "warning",
    danger: "danger",
    info: "info",
  };
  return map[color];
};

export const getVariantColors = (
  theme: ThemeType,
  color: UserTagColor,
  variant: UserTagVariant
): { border: string; background: string; text: string; icon: string } => {
  const base = theme.color[color];
  const inverted = theme.color.invertedBg[toInvertedBgKey(color)];

  if (variant === "filled") {
    return {
      border: base,
      background: base,
      text: theme.color.white,
      icon: theme.color.white,
    };
  }

  if (variant === "inverted") {
    return {
      border: theme.color.white,
      background: theme.color.white,
      text: base,
      icon: base,
    };
  }
  if (variant === "transparent") {
    return {
      border: "transparent",
      background: "transparent",
      text: base,
      icon: base,
    };
  }
  if (variant === "dark") {
    return {
      border: STATIC_DARK,
      background: STATIC_DARK,
      text: STATIC_BRIGHT,
      icon: STATIC_BRIGHT,
    };
  }
  if (variant === "bright") {
    return {
      border: STATIC_BRIGHT,
      background: STATIC_BRIGHT,
      text: STATIC_DARK,
      icon: STATIC_DARK,
    };
  }
  // bordered inverted background
  if (variant === "light") {
    return {
      border: base,
      background: inverted,
      text: base,
      icon: base,
    };
  }
  // bordered
  return {
    border: base,
    background: theme.color.white,
    text: base,
    icon: base,
  };
};
