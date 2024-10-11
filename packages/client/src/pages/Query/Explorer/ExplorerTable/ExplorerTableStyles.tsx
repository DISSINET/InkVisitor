import styled from "styled-components";

export const StyledTableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;
  width: 100%;
`;
interface StyledGrid {
  $columns: number;
}
export const StyledGrid = styled.div<StyledGrid>`
  display: grid;
  border: 1px solid ${({ theme }) => theme.color["black"]};
  align-content: start;
  grid-template-columns: ${({ $columns }) =>
    `3.5rem repeat(${$columns}, auto)`};
  color: ${({ theme }) => theme.color["black"]};
  width: 100%;
`;
export const StyledGridRow = styled.div`
  display: contents;
  cursor: pointer;

  &:nth-child(even) > div {
    background-color: #f0f8ff;
  }
  &:nth-child(odd) > div {
    background-color: ${({ theme }) => theme.color["white"]};
  }
  &:hover > div {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;
interface StyledGridColumn {}
export const StyledGridColumn = styled.div`
  display: grid;
  /* border-right: 1px solid ${({ theme }) => theme.color["black"]}; */
  border-top: 1px solid ${({ theme }) => theme.color["blue"][300]};
  padding: 0.3rem;
  padding-left: 1rem;
  background-color: ${({ theme }) => theme.color["white"]};
  align-items: center;

  > :not(:last-child) {
    margin-bottom: 0.3rem;
  }
`;

export const StyledGridHeader = styled.div`
  display: contents;
  position: sticky;
  top: 0;
  z-index: 1;
  box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.4);
`;
interface StyledGridHeaderColumn {
  $greyBackground?: boolean;
}
export const StyledGridHeaderColumn = styled(
  StyledGridColumn
)<StyledGridHeaderColumn>`
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
  /* border-left: 2px solid ${({ theme }) => theme.color["gray"][400]}; */

  position: sticky;
  top: 0;
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
export const StyledSpaceBetween = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
export const StyledTableHeader = styled(StyledSpaceBetween)`
  padding: ${({ theme }) => theme.space[2]};
  padding-top: 0.2rem;

  position: sticky;
  top: 0;
  background-color: ${({ theme }) => theme.color["gray"][200]};
  box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.4);
  z-index: 20;
`;
export const StyledTableFooter = styled(StyledSpaceBetween)`
  padding: ${({ theme }) => theme.space[2]};
  padding-bottom: 0.2rem;
`;
export const StyledEmpty = styled.span`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledPagination = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
