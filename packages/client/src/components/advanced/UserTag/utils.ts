import { IResponseUser } from "@inkvisitor/shared/types/response-user";
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

export interface UserTagColors {
  // thin outline of the whole pill
  border: string;
  // solid accent disc that holds the role icon
  avatarBackground: string;
  iconColor: string;
  // pale field the name sits on
  labelBackground: string;
  labelText: string;
}

// Two-tone "contributor badge": a solid accent avatar disc floating on a pale
// name field. The colour split (not just the pill shape) is what makes it read
// as a person rather than a Button.
export const getVariantColors = (
  theme: ThemeType,
  color: UserTagColor,
  variant: UserTagVariant
): UserTagColors => {
  const base = theme.color[color];
  const inverted = theme.color.invertedBg[toInvertedBgKey(color)];

  if (variant === "filled") {
    return {
      border: base,
      avatarBackground: base,
      iconColor: base,
      labelBackground: inverted,
      labelText: base,
    };
  }

  if (variant === "inverted") {
    return {
      border: theme.color.white,
      avatarBackground: theme.color.white,
      iconColor: base,
      labelBackground: theme.color.white,
      labelText: base,
    };
  }
  if (variant === "transparent") {
    return {
      border: "transparent",
      avatarBackground: "transparent",
      iconColor: base,
      labelBackground: "transparent",
      labelText: base,
    };
  }
  if (variant === "dark") {
    return {
      border: STATIC_DARK,
      avatarBackground: STATIC_DARK,
      iconColor: STATIC_BRIGHT,
      labelBackground: STATIC_DARK,
      labelText: STATIC_BRIGHT,
    };
  }
  if (variant === "bright") {
    return {
      border: STATIC_BRIGHT,
      avatarBackground: STATIC_BRIGHT,
      iconColor: STATIC_DARK,
      labelBackground: STATIC_BRIGHT,
      labelText: STATIC_DARK,
    };
  }
  // bordered inverted background
  if (variant === "light") {
    return {
      border: base,
      avatarBackground: base,
      iconColor: base,
      labelBackground: inverted,
      labelText: base,
    };
  }
  // bordered
  return {
    border: base,
    avatarBackground: base,
    iconColor: base,
    labelBackground: theme.color.white,
    labelText: base,
  };
};
