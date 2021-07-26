import styled from "styled-components";
import { Colors } from "types";

interface StyledFooter {
  color: typeof Colors[number];
  height: number;
  layoutWidth: number;
}
export const StyledFooter = styled.div<StyledFooter>`
  width: ${({ layoutWidth }) => layoutWidth};
  height: ${({ height }) => `${height}px`};
  background-color: ${({ theme, color }) => theme.color[color]};
`;
