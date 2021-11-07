import styled from "styled-components";
import { space1, space2 } from "Theme/constants";

interface IButtonStyle {
  hasIcon?: boolean;
  fullWidth?: boolean;
  noBorder?: boolean;
  textRegular?: boolean;
  inverted: boolean;
  color: any;
  disabled?: boolean;
  radiusLeft?: boolean;
  radiusRight?: boolean;
}
export const StyledButton = styled.button<IButtonStyle>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ fullWidth }) => (fullWidth ? "100%" : "auto")};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ disabled, textRegular }) =>
    disabled ? 400 : textRegular ? 500 : 900};
  padding: ${space1} ${({ hasIcon }) => (hasIcon ? space1 : space2)};
  border-color: ${({ theme, disabled, color }) =>
    disabled ? theme.color["gray"][400] : theme.color[color]};
  border-width: ${({ noBorder }) => (noBorder ? 0 : "thin")};
  border-style: solid;
  border-radius: ${({ radiusLeft, radiusRight }) =>
    radiusLeft ? "7px 0 0 7px" : radiusRight ? "0 7px 7px 0" : 0};
  color: ${({ theme, disabled, color, inverted }) =>
    disabled
      ? theme.color["gray"][800]
      : inverted
      ? theme.color[color]
      : theme.color["white"]};
  background: ${({ theme, disabled, color, inverted }) =>
    disabled
      ? "repeating-linear-gradient(-45deg,#cbd5e0,#cbd5e0,1px,#fff 1px,#fff 12px)"
      : inverted
      ? theme.color["invertedBg"][color]
      : theme.color[color]};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  white-space: nowrap;

  transition: border-color 0.2s, color 0.2s, background-color 0.2s;
  :focus {
    outline: 0;
  }
`;

export const StyledButtonLabel = styled.span<{ hasIcon?: boolean }>`
  margin-left: ${({ theme, hasIcon }) => (hasIcon ? theme.space[2] : 0)};
`;
