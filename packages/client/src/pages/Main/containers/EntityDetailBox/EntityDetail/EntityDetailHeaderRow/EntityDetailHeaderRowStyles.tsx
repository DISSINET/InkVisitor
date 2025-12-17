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
  justify-content: ${({ $widthTooNarrow, $hasWarnings }) =>
    $widthTooNarrow && !$hasWarnings ? "center" : "flex-start"};
  gap: 0.6rem;
  width: 100%;
  margin-top: 1.6rem;
  padding-bottom: ${({ theme }) => theme.space[2]};
  padding-right: ${({ theme }) => theme.space[6]};
  padding-left: 2rem;
  padding-left: ${({ $widthTooNarrow }) =>
    $widthTooNarrow ? "2rem" : "10.9rem"};
  background: ${({ theme }) => theme.color["gray"][200]};
  box-shadow: 4px 7px 5px -8px rgba(0, 0, 0, 0.5);
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
