import { ThemeColor } from "Theme/theme";
import styled from "styled-components";

interface StyledCircle {
  $color: keyof ThemeColor;
  bgColor?: keyof ThemeColor;
  size: number;
}
export const StyledCircle = styled.div<StyledCircle>`
  border: 2px solid;
  border-color: ${({ theme, $color }) => theme.color[$color]};
  border-radius: 5rem;
  background-color: ${({ theme, bgColor }) =>
    bgColor ? theme.color[bgColor] : ""};
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
  $color: keyof ThemeColor;
}
export const StyledLetter = styled.p<StyledLetter>`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme, $color }) => theme.color[$color]};
`;

export const StyledFlexCenter = styled.div`
  display: flex;
  align-items: center;
`;
