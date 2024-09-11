import styled from "styled-components";

interface StyledGrid {
  $columns: number;
}
export const StyledGrid = styled.div<StyledGrid>`
  display: grid;
  grid-template-columns: ${({ $columns }) => `repeat(${$columns}, auto)`};
  color: ${({ theme }) => theme.color["black"]};
  width: 100%;
`;
export const StyledGridColumn = styled.div`
  display: grid;
  border-right: 1px solid ${({ theme }) => theme.color["black"]};
  border-bottom: 1px solid ${({ theme }) => theme.color["blue"][300]};
  padding: 0.3rem;
  padding-left: 1rem;
`;

interface StyledGridHeader {
  $greyBackground?: boolean;
}
export const StyledGridHeader = styled(StyledGridColumn)<StyledGridHeader>`
  background-color: ${({ theme, $greyBackground }) =>
    $greyBackground ? theme.color["gray"][600] : theme.color["success"]};
  color: ${({ theme, $greyBackground }) =>
    $greyBackground ? theme.color["white"] : "white"};
  border: none;
  height: 3rem;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  align-items: end;
  padding-bottom: 0.5rem;
`;

export const StyledNewColumn = styled.div`
  width: 27rem;
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  border-left: 2px solid ${({ theme }) => theme.color["gray"][400]};
`;
export const StyledNewColumnGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: repeat(4, 2.5rem);
  gap: 1rem;
  padding: 1rem;
`;
export const StyledNewColumnLabel = styled.div`
  display: flex;
  align-items: center;
  white-space: nowrap;
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledNewColumnValue = styled.div`
  display: grid;
  align-items: center;
`;
export const StyledTableHeader = styled.div`
  display: flex;
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  padding: ${({ theme }) => theme.space[2]};
  align-items: center;
  justify-content: space-between;
`;
export const StyledEmpty = styled.span`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
