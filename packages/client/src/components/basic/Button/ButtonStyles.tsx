import styled from "styled-components";
import theme, { InvertedBgColor, ThemeColor } from "Theme/theme";
import { ButtonSize } from "types";

const getRadius = (
  $radiusLeft?: boolean,
  $radiusRight?: boolean,
  $shape?: "square" | "circle" | "rounded-sm" | "rounded-md" | "rounded-lg" | "rounded-full",
) => {
  if ($shape === "circle") {
    return "50%";
  } else if ($shape === "square") {
    return theme.borderRadius["rounded-sm"];
  } else if ($radiusLeft && $radiusRight) {
    return "7px";
  } else if ($radiusLeft) {
    return "7px 0 0 7px";
  } else if ($radiusRight) {
    return "0 7px 7px 0";
  } else if ($shape) {
    return theme.borderRadius[$shape as keyof typeof theme.borderRadius];
  } else {
    return "0";
  }
};
const getFontSize = ($size: ButtonSize) => {
  switch ($size) {
    case ButtonSize.Small:
      return "xs";
    case ButtonSize.Medium:
      return "base";
    case ButtonSize.Large:
      return "lg";
    case ButtonSize.ExtraLarge:
      return "xl";
  }
};
const getVerticalMargin = ($size: ButtonSize) => {
  switch ($size) {
    case ButtonSize.Small:
      return "0.25rem";
    case ButtonSize.Medium:
      return "0.3rem";
    case ButtonSize.Large:
      return "0.45rem";
    case ButtonSize.ExtraLarge:
      return "0.6rem";
  }
};
const getHorizontalMargin = ($size: ButtonSize, $iconButton?: boolean) => {
  switch ($size) {
    case ButtonSize.Small:
      return $iconButton ? "0.25rem" : "0.5rem";
    case ButtonSize.Medium:
      return $iconButton ? "0.3rem" : "0.55rem";
    case ButtonSize.Large:
      return $iconButton ? "0.45rem" : "0.7rem";
    case ButtonSize.ExtraLarge:
      return $iconButton ? "0.6rem" : "0.9rem";
  }
};
interface IButtonStyle {
  $iconButton?: boolean;
  $fullWidth?: boolean;
  $noBorder?: boolean;
  $noBackground?: boolean;
  $textRegular?: boolean;
  $inverted: boolean;
  $color: keyof ThemeColor;
  $textColor?: keyof ThemeColor;
  $borderColor?: keyof ThemeColor;
  $disabled?: boolean;
  $radiusLeft?: boolean;
  $radiusRight?: boolean;
  $noPadding?: boolean;
  $fullHeight?: boolean;

  $shape?: "square" | "circle" | "rounded-sm" | "rounded-md" | "rounded-lg" | "rounded-full";
  $size: ButtonSize;
}
export const StyledButton = styled.button.attrs(({ ref }) => ({
  ref: ref,
}))<IButtonStyle>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $fullWidth, $shape, $size }) => {
    if ($fullWidth) return "100%";
    if ($shape === "circle" || $shape === "square") {
      switch ($size) {
        case ButtonSize.Small:
          return "2rem";
        case ButtonSize.Medium:
          return "2.25rem";
        case ButtonSize.Large:
          return "3rem";
        case ButtonSize.ExtraLarge:
          return "3.9rem";
      }
    }
    return "auto";
  }};
  height: ${({ $fullHeight, $shape, $size }) => {
    if ($fullHeight) return "100%";
    if ($shape === "circle" || $shape === "square") {
      switch ($size) {
        case ButtonSize.Small:
          return "2rem";
        case ButtonSize.Medium:
          return "2.25rem";
        case ButtonSize.Large:
          return "3rem";
        case ButtonSize.ExtraLarge:
          return "3.9rem";
      }
    }
    return "";
  }};
  font-size: ${({ theme, $size }) => theme.fontSize[getFontSize($size)]};
  font-weight: ${({ $disabled, $textRegular }) => ($disabled ? 400 : $textRegular ? 500 : 900)};
  padding: ${({ $iconButton, $size, $noPadding, $shape }) =>
    $noPadding || $shape === "circle" || $shape === "square"
      ? "0"
      : `${getVerticalMargin($size)} ${getHorizontalMargin($size, $iconButton)}`};
  border-color: ${({ theme, $disabled, $color, $borderColor }) =>
    $disabled ? theme.color["gray"][400] : theme.color[$borderColor ?? $color]};
  border-width: ${({ $noBorder }) => ($noBorder ? 0 : "thin")};
  border-style: solid;
  border-radius: ${({ $radiusLeft, $radiusRight, $shape }) =>
    getRadius($radiusLeft, $radiusRight, $shape)};
  /* border-radius: ${({ theme }) => theme.borderRadius.xs}; */
  color: ${({ theme, $disabled, $color, $inverted, $textColor }) => {
    if ($disabled) {
      return theme.color["gray"][500];
    }
    if ($textColor) {
      return theme.color[$textColor];
    }
    if ($inverted) {
      return theme.color[$color];
    }
    return theme.color["white"];
  }};
  background: ${({ theme, $noBackground, $disabled, $color, $inverted }) => {
    if ($noBackground) {
      return "none";
    }
    if ($disabled) {
      return theme.background["stripes"];
    }
    if ($inverted) {
      return theme.color.invertedBg[$color as keyof InvertedBgColor];
    }

    return theme.color[$color];
  }};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  white-space: nowrap;

  transition:
    border-color 0.2s,
    color 0.2s,
    background-color 0.2s,
    opacity 0.2s;
  &:focus {
    outline: 0;
  }
`;

export const StyledButtonLabel = styled.span<{
  $hasIcon?: boolean;
  $noIconMargin?: boolean;
}>`
  margin-left: ${({ theme, $hasIcon = false, $noIconMargin = false }) =>
    $hasIcon ? ($noIconMargin ? 0 : "0.4rem") : 0};
  text-transform: lowercase;
`;
