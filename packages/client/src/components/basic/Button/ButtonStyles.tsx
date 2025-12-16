import styled from "styled-components";
import { InvertedBgColor, ThemeColor } from "Theme/theme";
import { ButtonSize } from "types";

const getRadius = (
  $radiusLeft?: boolean,
  $radiusRight?: boolean,
  $circular?: boolean
) => {
  if ($circular) {
    return "50%";
  }
  if ($radiusLeft && $radiusRight) {
    return "7px";
  } else if ($radiusLeft) {
    return "7px 0 0 7px";
  } else if ($radiusRight) {
    return "0 7px 7px 0";
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
  $disabled?: boolean;
  $radiusLeft?: boolean;
  $radiusRight?: boolean;
  $noPadding?: boolean;
  $fullHeight?: boolean;

  $circular?: boolean;
  // size only works for circular buttons
  $size: ButtonSize;
  // width only works for non-circular buttons
  $width?: number;
}
export const StyledButton = styled.button.attrs(({ ref }) => ({
  ref: ref,
}))<IButtonStyle>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $fullWidth, $circular, $size }) => {
    if ($fullWidth) return "100%";
    if ($circular) {
      switch ($size) {
        case ButtonSize.Small:
          return "2rem";
        case ButtonSize.Medium:
          return "2.5rem";
        case ButtonSize.Large:
          return "3rem";
      }
    }
    return "auto";
  }};
  height: ${({ $fullHeight, $circular, $size }) => {
    if ($fullHeight) return "100%";
    if ($circular) {
      switch ($size) {
        case ButtonSize.Small:
          return "2rem";
        case ButtonSize.Medium:
          return "2.5rem";
        case ButtonSize.Large:
          return "3rem";
      }
    }
    return "";
  }};
  font-size: ${({ theme, $size }) => theme.fontSize[getFontSize($size)]};
  font-weight: ${({ $disabled, $textRegular }) =>
    $disabled ? 400 : $textRegular ? 500 : 900};
  padding: ${({ $iconButton, $size, $noPadding }) =>
    $noPadding
      ? "0"
      : `${getVerticalMargin($size)} ${getHorizontalMargin(
          $size,
          $iconButton
        )}`};
  border-color: ${({ theme, $disabled, $color }) =>
    $disabled ? theme.color["gray"][400] : theme.color[$color]};
  border-width: ${({ $noBorder }) => ($noBorder ? 0 : "thin")};
  border-style: solid;
  border-radius: ${({ $radiusLeft, $radiusRight, $circular }) =>
    getRadius($radiusLeft, $radiusRight, $circular)};
  color: ${({ theme, $disabled, $color, $inverted }) => {
    if ($disabled) {
      return theme.color["gray"][800];
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

  transition: border-color 0.2s, color 0.2s, background-color 0.2s;
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
