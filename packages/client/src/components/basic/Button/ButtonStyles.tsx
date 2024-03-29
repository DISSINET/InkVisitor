import styled from "styled-components";
import { space1, space2 } from "Theme/constants";
import { ThemeColor } from "Theme/theme";

interface IButtonStyle {
  $hasIcon?: boolean;
  $fullWidth?: boolean;
  $noBorder?: boolean;
  $noBackground?: boolean;
  $textRegular?: boolean;
  $inverted: boolean;
  $color: keyof ThemeColor;
  disabled?: boolean;
  $radiusLeft?: boolean;
  $radiusRight?: boolean;
  $paddingX: boolean;
}
export const StyledButton = styled.button.attrs(({ ref }) => ({
  ref: ref,
}))<IButtonStyle>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ disabled, $textRegular }) =>
    disabled ? 400 : $textRegular ? 500 : 900};
  padding: ${space1} ${({ $hasIcon }) => ($hasIcon ? space1 : space2)};
  padding-left: ${({ $paddingX }) => ($paddingX ? "0.5rem" : "")};
  padding-right: ${({ $paddingX }) => ($paddingX ? "0.5rem" : "")};
  border-color: ${({ theme, disabled, $color }) =>
    disabled ? theme.color["gray"][400] : theme.color[$color]};
  border-width: ${({ $noBorder }) => ($noBorder ? 0 : "thin")};
  border-style: solid;
  border-radius: ${({ $radiusLeft, $radiusRight }) =>
    $radiusLeft ? "7px 0 0 7px" : $radiusRight ? "0 7px 7px 0" : 0};
  color: ${({ theme, disabled, $color, $inverted }) =>
    disabled
      ? theme.color["gray"][800]
      : $inverted
      ? theme.color[$color]
      : theme.color["white"]};
  background: ${({ theme, $noBackground, disabled, $color, $inverted }) =>
    $noBackground
      ? "none"
      : disabled
      ? theme.background["stripes"]
      : $inverted
      ? theme.color["invertedBg"][$color]
      : theme.color[$color]};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  white-space: nowrap;

  transition: border-color 0.2s, color 0.2s, background-color 0.2s;
  :focus {
    outline: 0;
  }
`;

export const StyledButtonLabel = styled.span<{
  $hasIcon?: boolean;
  $noIconMargin?: boolean;
}>`
  margin-left: ${({ theme, $hasIcon = false, $noIconMargin = false }) =>
    $hasIcon ? ($noIconMargin ? 0 : "0.3rem") : 0};
  text-transform: lowercase;
`;
