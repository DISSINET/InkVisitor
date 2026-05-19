import styled from "styled-components";

interface StyledTableWrapper {
  // $height: number;
}
export const StyledTableWrapper = styled.div<StyledTableWrapper>`
  position: relative;
  margin: 0.5rem 1rem 0 1rem;
  overflow: hidden;
`;
export const StyledRowWrapper = styled.div`
  display: block;
`;
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
  height: ${({ theme }) => theme.space[12]};
  background-color: ${({ theme }) => theme.color["success"]};
  color: ${({ theme }) => theme.color["white"]};
  border-top-left-radius: ${({ theme }) => theme.borderRadius["default"]};
  border-top-right-radius: ${({ theme }) => theme.borderRadius["default"]};
`;

export const StyledBody = styled.div``;

// StyledColumn removed in favor of lightweight classes in styles.css

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
  background-color: ${({ theme }) => theme.color["gray"][200]};
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

export const StyledFocusedCircle = styled.span`
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
  z-index: 2;
  svg {
    height: 1.6rem;
    width: 1.6rem;
  }
`;
export const StyledCounter = styled.div`
  white-space: nowrap;
  color: ${({ theme }) => theme.color["black"]};
`;
