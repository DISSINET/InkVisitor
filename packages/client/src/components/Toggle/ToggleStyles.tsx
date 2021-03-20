import styled from "styled-components";

import { Colors } from "types";

interface ToggleWrapper {
  color: typeof Colors[number];
  inverted: boolean;
}
export const ToggleWrapper = styled.div<ToggleWrapper>`
  display: inline-flex;
  align-items: flex-end;
  border: 2px solid ${({ theme, color }) => theme.colors[color]};
  color: ${({ theme, color, inverted }) =>
    inverted ? theme.colors[color] : theme.colors["white"]};
  background-color: ${({ theme, color, inverted }) =>
    inverted ? theme.colors["white"] : theme.colors[color]};
`;
interface LabelWrapper {
  hasIcon?: boolean;
}
export const LabelWrapper = styled.div<LabelWrapper>`
  display: ${({ hasIcon }) => (hasIcon ? "flex" : "inline-block")};
  align-items: center;
  vertical-align: middle;
  height: 2.4rem;
  overflow: hidden !important;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  vertical-align: bottom;
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  font-size: ${({ theme }) => theme.fontSizes["sm"]};
  max-width: ${({ theme }) => theme.space[56]};
`;
