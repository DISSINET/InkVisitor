import styled from "styled-components";
import { Colors } from "types";

interface StyledCircle {
  color: typeof Colors[number];
  size: number;
}
export const StyledCircle = styled.div<StyledCircle>`
  border: 2px solid;
  border-color: ${({ theme, color }) => theme.color[color]};
  border-radius: 5rem;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 1;
  min-width: 2rem;
  height: 2rem;
  padding-left: ${({ theme }) => theme.space[2]};
  padding-right: ${({ theme }) => theme.space[2]};
`;

interface StyledLetter {
  size: number;
  color: typeof Colors[number];
}
export const StyledLetter = styled.p<StyledLetter>`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme, color }) => theme.color[color]};
`;
