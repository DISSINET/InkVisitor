import styled from "styled-components";
import { space1, space2 } from "Theme/constants";
import { ThemeColor } from "Theme/theme";
import { ButtonSize } from "types";

const getRadius = ($radiusLeft?: boolean, $radiusRight?: boolean) => {
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
      return "sm";
    case ButtonSize.Large:
      return "base";
  }
};
interface IButtonStyle {
  $size: ButtonSize;
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
}
export const StyledButton = styled.button.attrs(({ ref }) => ({
  ref: ref,
}))<IButtonStyle>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  font-size: ${({ theme, $size }) => theme.fontSize[getFontSize($size)]};
  font-weight: ${({ $disabled, $textRegular }) =>
    $disabled ? 400 : $textRegular ? 500 : 900};
  padding: ${space1} ${({ $iconButton }) => ($iconButton ? space1 : space2)};
  border-color: ${({ theme, $disabled, $color }) =>
    $disabled ? theme.color["gray"][400] : theme.color[$color]};
  border-width: ${({ $noBorder }) => ($noBorder ? 0 : "thin")};
  border-style: solid;
  border-radius: ${({ $radiusLeft, $radiusRight }) =>
    getRadius($radiusLeft, $radiusRight)};
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
      return theme.color["invertedBg"][$color];
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
