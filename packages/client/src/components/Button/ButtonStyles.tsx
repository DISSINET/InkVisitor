import styled from "styled-components";
import { space1, space2 } from "Theme/constants";

interface IButtonStyle {
  hasIcon?: boolean;
  fullWidth?: boolean;
  inverted: boolean;
  color: string;
  disabled?: boolean;
}
export const StyledButton = styled.button<IButtonStyle>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ fullWidth }) => (fullWidth ? "100%" : "auto")};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: 900;
  padding: ${space1} ${({ hasIcon }) => (hasIcon ? space1 : space2)};
  border-color: ${({ theme, disabled, color }) =>
    disabled ? theme.color["gray"][400] : theme.color[color]};
  border-width: thin;
  border-style: solid;

  color: ${({ theme, disabled, color, inverted }) => {
    return disabled
      ? theme.color["gray"][200]
      : inverted
      ? theme.color[color]
      : theme.color["white"];
  }};
  background-color: ${({ theme, disabled, color, inverted }) => {
    return disabled
      ? theme.color["gray"][400]
      : inverted
      ? theme.color["invertedBg"][color]
      : theme.color[color];
  }};
  cursor: ${({ disabled }) => {
    return disabled ? "not-allowed" : "pointer";
  }};
  white-space: nowrap;
  :focus {
    outline: 0;
  }
`;

export const StyledButtonLabel = styled.span<{ hasIcon?: boolean }>`
  margin-left: ${({ theme, hasIcon }) => (hasIcon ? theme.space[2] : 0)};
`;
