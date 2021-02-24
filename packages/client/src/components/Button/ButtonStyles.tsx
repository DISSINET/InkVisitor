import styled from "styled-components";
import { space1, space2 } from "Theme/constants";

interface IButtonStyle {
  hasIcon?: boolean;
  hasMarginRight?: boolean;
  inverted?: boolean;
  color: string;
}
export const StyledButton = styled.button<IButtonStyle>`
  display: flex;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSizes["xs"]};
  font-weight: 700;
  padding: ${space1} ${({ hasIcon }) => (hasIcon ? space1 : space2)};
  border: 2px solid ${({ theme, color }) => theme.colors[color]};
  margin-right: ${({ hasMarginRight }) => (hasMarginRight ? space1 : "0")};
  color: ${({ theme, color, inverted }) =>
    inverted ? theme.colors[color] : theme.colors["white"]};
  background-color: ${({ theme, color, inverted }) =>
    inverted ? theme.colors["white"] : theme.colors[color]};
  cursor: pointer;
  :focus {
    outline: 0;
  }
`;
