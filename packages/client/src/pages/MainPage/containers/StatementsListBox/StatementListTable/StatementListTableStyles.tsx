import styled from "styled-components";

export const StyledTable = styled.table`
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;
`;
export const StyledTHead = styled.thead`
  border-bottom-width: ${({ theme }) => theme.borderWidth[2]};
  border-bottom-style: solid;
  border-bottom-color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
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
      ? theme.color["primary"]
      : isOdd
      ? theme.color["white"]
      : theme.color["blue"][50]};
  color: ${({ theme, isSelected }) =>
    isSelected ? theme.color["white"] : theme.color["black"]};
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  td:first-child {
    padding-left: ${({ theme }) => theme.space[1]};
  }
`;
export const StyledTd = styled.td`
  padding: ${({ theme }) => theme.space[2]} 0;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
