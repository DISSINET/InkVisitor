import { ThemeColor } from "Theme/theme";
import { GrClone } from "react-icons/gr";
import styled from "styled-components";

interface StyledActantHeaderRow {
  $widthTooNarrow: boolean;
  $hasWarnings: boolean;
}
export const StyledActantHeaderRow = styled.div<StyledActantHeaderRow>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: ${({ $widthTooNarrow, $hasWarnings }) =>
    $widthTooNarrow && !$hasWarnings ? "center" : "flex-start"};
  gap: 0.6rem;
  width: 100%;
  margin-top: 1.6rem;
  padding-bottom: ${({ theme }) => theme.space[2]};
  padding-right: ${({ theme }) => theme.space[6]};
  padding-left: 2rem;
  padding-left: ${({ $widthTooNarrow }) => ($widthTooNarrow ? "2rem" : "10.9rem")};
  z-index: 10;
`;
export const StyledTagWrap = styled.div`
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
`;

interface StyledGrClone {
  $color: keyof ThemeColor;
}
export const StyledGrClone = styled(GrClone)<StyledGrClone>`
  & path {
    stroke: ${({ theme, $color }) => theme.color[$color]};
  }
`;
