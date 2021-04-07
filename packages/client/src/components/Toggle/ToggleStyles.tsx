import styled from "styled-components";

import { Colors } from "types";

interface StyledToggle {
  color: typeof Colors[number];
  inverted: boolean;
}
export const StyledToggle = styled.div<StyledToggle>`
  height: ${({ theme }) => theme.space[10]};
  display: inline-flex;
  border: 2px solid ${({ theme, color }) => theme.color[color]};
  color: ${({ theme, color, inverted }) =>
    inverted ? theme.color[color] : theme.color["white"]};
  background-color: ${({ theme, color, inverted }) =>
    inverted ? theme.color["white"] : theme.color[color]};
  cursor: pointer;
`;
interface StyledLabel {
  hasIcon?: boolean;
}
export const StyledLabel = styled.div<StyledLabel>`
  display: ${({ hasIcon }) => (hasIcon ? "flex" : "inline-block")};
  align-items: center;
  overflow: hidden !important;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
  padding-left: ${({ theme }) => theme.space[2]};
  padding-right: ${({ theme }) => theme.space[2]};
  padding-bottom: 0.15rem;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  max-width: ${({ theme }) => theme.space[56]};
`;

interface StyledIcon {}
export const StyledIcon = styled.div<StyledIcon>`
  padding-left: ${({ theme }) => `${theme.space[2]}`};
  padding-top: 0.15rem;
`;
