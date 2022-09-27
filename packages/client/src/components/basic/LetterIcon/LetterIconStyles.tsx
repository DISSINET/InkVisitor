import styled from "styled-components";
import { Colors } from "types";

interface StyledCircle {
  color: typeof Colors[number];
  size: number;
}
export const StyledCircle = styled.div<StyledCircle>`
  border: 1px solid;
  border-color: ${({ theme, color }) => theme.color[color]};
  border-radius: 5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1.6rem;
  height: 1.6rem;
`;

interface StyledLetter {
  size: number;
}
export const StyledLetter = styled.p<StyledLetter>`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  margin-left: 1px;
`;
