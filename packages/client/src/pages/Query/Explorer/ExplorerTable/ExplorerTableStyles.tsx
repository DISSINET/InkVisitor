import styled from "styled-components";

interface StyledTableWrapper {
  // $height: number;
}
export const StyledTableWrapper = styled.div<StyledTableWrapper>``;
interface StyledRow {
  $isOdd: boolean;
  $isSelected: boolean;
  $width: number;
  $height: number;
}
export const StyledRow = styled.div<StyledRow>`
  display: flex;
  width: ${({ $width }) => `${$width}px`};
  align-items: center;
  cursor: pointer;
  height: ${({ theme, $height }) => `${$height}px`};
  background-color: ${({ theme, $isOdd, $isSelected }) =>
    $isSelected
      ? theme.color["tableOpened"]
      : $isOdd
      ? theme.color["white"]
      : theme.color["tableOddRow"]};
  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;

export const StyledHeader = styled.div`
  display: flex;
  z-index: 1;
  height: ${({ theme }) => theme.space[18]};
  background-color: ${({ theme }) => theme.color["success"]};
  color: ${({ theme }) => theme.color["white"]};
`;

interface StyledColumn {
  $isHeader?: boolean;
  $width: number;
}
export const StyledColumn = styled.div<StyledColumn>`
  display: inline-flex;
  width: ${({ $width }) => `${$width}px`};
  font-weight: ${({ theme, $isHeader }) =>
    $isHeader ? theme.fontWeight["bold"] : theme.fontWeight["normal"]};
  height: ${({ theme }) => theme.space[18]};

  padding: 0.3rem;
  padding-left: 1rem;
  align-items: center;
  border: 1px solid white;
  gap: ${({ theme }) => theme.space[2]};
`;

export const StyledColumnContent = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;
  overflow-x: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  gap: ${({ theme }) => theme.space[2]};
`;

export const StyledNewColumn = styled.div`
  position: absolute;
  background-color: ${({ theme }) => theme.color["white"]};
  right: 0;
  bottom: 0;
  top: 4rem;
  width: 27rem;
  border-left: 2px solid ${({ theme }) => theme.color.white};
`;
export const StyledNewColumnHeader = styled.div`
  background-color: ${({ theme }) => theme.color.query3};
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  color: ${({ theme }) => theme.color["white"]};
  width: 100%;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  padding: 1rem;
`;
export const StyledNewColumnContent = styled.div`
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
export const StyledTableControl = styled(StyledSpaceBetween)`
  padding: ${({ theme }) => theme.space[2]};
  padding-top: 0.2rem;
  margin-right: 2rem;

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
