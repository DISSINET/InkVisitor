import styled from "styled-components";
import { Colors } from "types";

interface StyledFooter {
  color: typeof Colors[number];
  height: number;
}
export const StyledFooter = styled.div<StyledFooter>`
  background-color: ${({ theme, color }) => theme.color[color]};
  height: ${({ height }) => `${height}px`};
`;
