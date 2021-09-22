import styled from "styled-components";

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
  padding: ${({ theme }) => theme.space[2]};
  padding-left: 0;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledSubRow = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.space[2]};
  background-color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["white"]};
`;
