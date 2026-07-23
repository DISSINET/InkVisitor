import styled from "styled-components";
import theme, { InvertedBgColor, ThemeColor } from "Theme/theme";
import { ButtonShape, ButtonSize } from "types";

const sideRadius = {
  sm: theme.borderRadius["rounded-sm"],
  md: theme.borderRadius["rounded-md"],
  lg: theme.borderRadius["rounded-lg"],
  xl: theme.borderRadius["rounded-xl"],
  full: theme.borderRadius["rounded-full"],
};
const getRadius = ($shape?: ButtonShape) => {
  if ($shape === "sharp" || $shape === "sharp-square") {
    return "0";
  } else if ($shape === "circle") {
    return "50%";
  } else if ($shape === "square") {
    return theme.borderRadius["rounded-sm"];
  } else if ($shape?.startsWith("rounded-left-")) {
    const r = sideRadius[$shape.replace("rounded-left-", "") as keyof typeof sideRadius];
    return `${r} 0 0 ${r}`;
  } else if ($shape?.startsWith("rounded-right-")) {
    const r = sideRadius[$shape.replace("rounded-right-", "") as keyof typeof sideRadius];
    return `0 ${r} ${r} 0`;
  } else if ($shape) {
    return theme.borderRadius[$shape as keyof typeof theme.borderRadius];
  } else {
    return "0";
  }
};
// icons are sized in em, so the size scale drives the glyph of icon-only buttons;
// labelled buttons keep one text size and grow through padding instead
const getFontSize = ($size: ButtonSize, $hasLabel?: boolean) => {
  if ($hasLabel) {
    return $size === ButtonSize.Medium
      ? `calc(${theme.fontSize.xs} + 0.1rem)`
      : theme.fontSize.xs;
  }
  switch ($size) {
    case ButtonSize.Small:
      return theme.fontSize.xs;
    case ButtonSize.Medium:
      return theme.fontSize.base;
    case ButtonSize.Large:
      return theme.fontSize.lg;
    case ButtonSize.ExtraLarge:
      return theme.fontSize.xl;
  }
};
const getVerticalMargin = ($size: ButtonSize, $hasLabel?: boolean) => {
  switch ($size) {
    case ButtonSize.Small:
      return $hasLabel ? "0.3rem" : "0.25rem";
    case ButtonSize.Medium:
      return $hasLabel ? "0.55rem" : "0.3rem";
    case ButtonSize.Large:
      return $hasLabel ? "0.8rem" : "0.45rem";
    case ButtonSize.ExtraLarge:
      return $hasLabel ? "1.1rem" : "0.8rem";
  }
};
const getHorizontalMargin = ($size: ButtonSize, $iconButton?: boolean) => {
  switch ($size) {
    case ButtonSize.Small:
      return $iconButton ? "0.25rem" : "0.6rem";
    case ButtonSize.Medium:
      return $iconButton ? "0.3rem" : "1rem";
    case ButtonSize.Large:
      return $iconButton ? "0.45rem" : "1.4rem";
    case ButtonSize.ExtraLarge:
      return $iconButton ? "0.8rem" : "1.9rem";
  }
};
interface IButtonStyle {
  $iconButton?: boolean;
  $hasLabel?: boolean;
  $fullWidth?: boolean;
  $noBorder?: boolean;
  $noBackground?: boolean;
  $textRegular?: boolean;
  $inverted: boolean;
  $color: keyof ThemeColor;
  $textColor?: keyof ThemeColor;
  $borderColor?: keyof ThemeColor;
  $disabled?: boolean;
  $noPadding?: boolean;
  $fullHeight?: boolean;

  $shape?: ButtonShape;
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
  font-size: ${({ $size, $hasLabel }) => getFontSize($size, $hasLabel)};
  font-weight: ${({ $disabled, $textRegular }) => ($disabled ? 400 : $textRegular ? 500 : 900)};
  padding: ${({ $iconButton, $size, $noPadding, $shape, $hasLabel }) =>
    $noPadding || $shape === "circle" || $shape === "square"
      ? "0"
      : `${getVerticalMargin($size, $hasLabel)} ${getHorizontalMargin($size, $iconButton)}`};
  border-color: ${({ theme, $disabled, $color, $borderColor }) =>
    $disabled ? theme.color["gray"][400] : theme.color[$borderColor ?? $color]};
  border-width: ${({ $noBorder }) => ($noBorder ? 0 : "thin")};
  border-style: solid;
  border-radius: ${({ $shape }) => getRadius($shape)};
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
`;
