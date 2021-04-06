import styled from "styled-components";

import { Colors } from "types";

interface StyledToggle {
  color: typeof Colors[number];
  inverted: boolean;
}
export const StyledToggle = styled.div<StyledToggle>`
  display: inline-flex;
  border: 2px solid ${({ theme, color }) => theme.colors[color]};
  color: ${({ theme, color, inverted }) =>
    inverted ? theme.colors[color] : theme.colors["white"]};
  background-color: ${({ theme, color, inverted }) =>
    inverted ? theme.colors["white"] : theme.colors[color]};
  cursor: pointer;
`;
interface StyledLabel {
  hasIcon?: boolean;
}
export const StyledLabel = styled.div<StyledLabel>`
  height: 2.25rem;
  display: ${({ hasIcon }) => (hasIcon ? "flex" : "inline-block")};
  align-items: center;
  overflow: hidden !important;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
  padding: ${({ theme }) => `0.15rem ${theme.space[2]}`};
  font-size: ${({ theme }) => theme.fontSizes["sm"]};
  max-width: ${({ theme }) => theme.space[56]};
`;

interface StyledIcon {}
export const StyledIcon = styled.div<StyledIcon>`
  padding-left: ${({ theme }) => `${theme.space[2]}`};
  padding-top: ${({ theme }) => `${theme.space[1]}`};
`;
