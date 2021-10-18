import styled from "styled-components";

interface StyledTr {
  isOdd?: boolean;
  isSelected?: boolean;
  opacity?: number;
}
export const StyledTr = styled.tr<StyledTr>`
  background-color: ${({ theme, isSelected }) =>
    isSelected ? theme.color["invertedBg"]["info"] : theme.color["white"]};
  color: ${({ theme, isSelected }) =>
    isSelected ? theme.color["primary"] : theme.color["black"]};
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  border-top: 1px solid ${({ theme }) => theme.color["gray"][500]};

  td:first-child {
    padding-left: ${({ theme }) => theme.space[1]};
  }
`;
export const StyledTd = styled.td`
  padding: ${({ theme }) => theme.space[2]};
  padding-left: 0;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  cursor: pointer;
`;
export const StyledSubRow = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.space[2]};
  background-color: ${({ theme }) => theme.color["gray"][200]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["black"]};
`;
