import { IResponseUser } from "@shared/types/response-user";
import { ThemeType } from "Theme/theme";

export type UserTagVariant = "bordered" | "light" | "filled";
export type UserTagColor = "primary" | "success" | "warning" | "danger" | "info";

export const getUserLabel = (
  user: IResponseUser | undefined,
  userId: string
): string => {
  if (!user) return userId;
  return user.name || user.email || user.id || userId;
};

const toInvertedBgKey = (
  color: UserTagColor
): keyof ThemeType["color"]["invertedBg"] => {
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

  if (variant === "light") {
    return {
      border: base,
      background: inverted,
      text: base,
      icon: base,
    };
  }

  return {
    border: base,
    background: theme.color.white,
    text: base,
    icon: base,
  };
};
