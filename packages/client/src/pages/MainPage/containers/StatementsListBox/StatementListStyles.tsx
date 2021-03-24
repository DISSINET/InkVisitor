import styled from "styled-components";

export const StyledTable = styled.table`
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;
`;
export const StyledTHead = styled.thead`
  border-bottom-width: ${({ theme }) => theme.borderWidths[2]};
  border-bottom-style: solid;
  border-bottom-color: ${({ theme }) => theme.colors["black"]};
  font-size: ${({ theme }) => theme.fontSizes["sm"]};
`;
export const StyledTh = styled.th`
  text-align: left;
`;
interface StyledTr {
  isOdd?: boolean;
  isSelected?: boolean;
  opacity?: number;
}
export const StyledTr = styled.tr<StyledTr>`
  background-color: ${({ theme, isOdd, isSelected }) =>
    isSelected
      ? theme.colors["primary"]
      : isOdd
      ? theme.colors["white"]
      : theme.colors["blue"][50]};
  color: ${({ theme, isSelected }) =>
    isSelected ? theme.colors["white"] : theme.colors["black"]};
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
`;
export const StyledTd = styled.td`
  padding: ${({ theme }) => theme.space[2]} 0;
  font-size: ${({ theme }) => theme.fontSizes["sm"]};
`;
