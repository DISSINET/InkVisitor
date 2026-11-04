import { ThemeColor } from "Theme/theme";
import styled from "styled-components";

interface StyledCircle {
  $color: keyof ThemeColor;
  bgColor?: keyof ThemeColor;
  size: number;
  $square: boolean;
}
export const StyledCircle = styled.div<StyledCircle>`
  border: 2px solid;
  border-color: ${({ theme, $color }) => theme.color[$color]};
  border-radius: ${({ theme, $square }) => ($square ? theme.borderRadius["sm"] : "5rem")};
  background-color: ${({ theme, bgColor }) => (bgColor ? theme.color[bgColor] : "")};
  display: inline-flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 1;
  min-width: ${({ $square }) => ($square ? "calc(2rem - 3px)" : "2rem")};
  height: ${({ $square }) => ($square ? "calc(2rem - 3px)" : "2rem")};
  // a single letter fits the square, so only the circle needs side padding
  padding-left: ${({ theme, $square }) => ($square ? 0 : theme.space[2])};
  padding-right: ${({ theme, $square }) => ($square ? 0 : theme.space[2])};
`;

interface StyledLetter {
  size: number;
  $color: keyof ThemeColor;
}
export const StyledLetter = styled.p<StyledLetter>`
  // the default line box leaves room below the glyph, which lifts it above the
  // middle of the circle
  margin: 0;
  line-height: 1;
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme, $color }) => theme.color[$color]};
`;
