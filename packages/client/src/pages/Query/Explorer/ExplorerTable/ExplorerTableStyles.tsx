import styled from "styled-components";

interface StyledTableWrapper {
  // $height: number;
}
export const StyledTableWrapper = styled.div<StyledTableWrapper>`
  display: flex;
  flex-direction: column;
  /* overflow: auto; */
  flex-shrink: 0;
  flex-grow: 1;
`;
interface StyledGrid {
  $columns: number;
}
export const StyledGrid = styled.div<StyledGrid>`
  display: grid;
  border: 1px solid ${({ theme }) => theme.color["black"]};
  align-content: start;
  grid-template-columns: ${({ $columns }) => `5rem repeat(${$columns}, auto)`};
  color: ${({ theme }) => theme.color["black"]};
  width: 100%;
`;
interface StyledGridRow {
  $isOdd: boolean;
  $isSelected: boolean;
}
export const StyledGridRow = styled.div<StyledGridRow>`
  display: contents;
  cursor: pointer;

  & > div {
    background-color: ${({ theme, $isOdd, $isSelected }) =>
      $isSelected
        ? theme.color["tableOpened"]
        : $isOdd
        ? theme.color["white"]
        : theme.color["tableOddRow"]};
  }
  &:hover > div {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;
interface StyledGridColumn {}
export const StyledGridColumn = styled.div`
  display: grid;
  gap: 0.3rem;
  grid-template-columns: auto auto;
  border-top: 0.5px solid ${({ theme }) => theme.color["gray"][600]};
  padding: 0.3rem;
  padding-left: 1rem;
  align-items: center;

  > :not(:last-child) {
    /* margin-bottom: 0.3rem; */
  }
`;

export const StyledGridHeader = styled.div`
  display: contents;
  z-index: 1;
`;
interface StyledGridHeaderColumn {
  $greyBackground?: boolean;
}
export const StyledGridHeaderColumn = styled(
  StyledGridColumn
)<StyledGridHeaderColumn>`
  background-color: ${({ theme, $greyBackground }) =>
    $greyBackground ? theme.color["query3"] : theme.color["success"]};
  color: ${({ theme, $greyBackground }) =>
    $greyBackground ? theme.color["white"] : "white"};
  border: none;
  justify-content: space-between;
  height: 3rem;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  align-items: end;
  padding-bottom: 0.5rem;
`;

export const StyledGridHeaderColumnContent = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
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

  /* position: sticky; */
  /* top: 0; */
  background-color: ${({ theme }) => theme.color["gray"][200]};
  box-shadow: 0 2px 3px -2px rgba(0, 0, 0, 0.3);
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

interface StyledFocusedCircle {
  checked: boolean;
}
export const StyledFocusedCircle = styled.span<StyledFocusedCircle>`
  position: absolute;
  background-color: ${({ theme }) => theme.color.focusedCheckbox};
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.color.focusedCheckbox};
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
`;
export const StyledCheckboxWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ theme }) => theme.color["black"]};
  cursor: pointer;
`;
export const StyledCounter = styled.div`
  white-space: nowrap;
  color: ${({ theme }) => theme.color["black"]};
`;
