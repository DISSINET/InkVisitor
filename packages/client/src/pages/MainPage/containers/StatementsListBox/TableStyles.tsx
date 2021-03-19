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
}
export const StyledTr = styled.tr<StyledTr>`
  background-color: ${({ theme, isOdd, isSelected }) =>
    isOdd ? theme.colors["white"] : theme.colors["blue"][50]};
`;
export const StyledTd = styled.td`
  padding: ${({ theme }) => theme.space[2]} 0;
  font-size: ${({ theme }) => theme.fontSizes["sm"]};
`;
