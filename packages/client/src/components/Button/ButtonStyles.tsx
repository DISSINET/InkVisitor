import styled from "styled-components";
import { space1, space2 } from "Theme/constants";

interface IButtonStyle {
  hasIcon?: boolean;
  fullWidth?: boolean;
  inverted: boolean;
  color: string;
}
export const StyledButton = styled.button<IButtonStyle>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ fullWidth }) => (fullWidth ? "100%" : "auto")};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: 900;
  padding: ${space1} ${({ hasIcon }) => (hasIcon ? space1 : space2)};
  border: 2px solid ${({ theme, color }) => theme.color[color]};
  color: ${({ theme, color, inverted }) =>
    inverted ? theme.color[color] : theme.color["white"]};
  background-color: ${({ theme, color, inverted }) =>
    inverted ? theme.color["white"] : theme.color[color]};
  cursor: pointer;
  white-space: nowrap;
  :focus {
    outline: 0;
  }
`;

export const StyledButtonLabel = styled.span<{ hasIcon?: boolean }>`
  margin-left: ${({ theme, hasIcon }) => (hasIcon ? theme.space[2] : 0)};
`;
