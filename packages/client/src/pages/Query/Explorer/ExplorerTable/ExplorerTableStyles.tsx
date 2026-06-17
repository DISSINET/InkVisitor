import styled from "styled-components";
import { FLOATING_SEARCH_COLLAPSED_SIZE } from "../../FloatingSearchContainer/FloatingSearchContainerStyles";

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
  position: relative;
  padding: ${({ theme }) => theme.space[2]};
  padding-top: 0.2rem;
  margin-right: 2rem;
  background-color: ${({ theme }) => theme.color["gray"][200]};
  z-index: 20;
`;

export const StyledControlGroup = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  flex-shrink: 0;
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
  margin-right: 0.1rem;
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

export const StyledLabelFilter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  width: 100%;
`;

export const StyledLabelFilterCheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-left: 0.2rem;
  gap: 0.2rem;
`;

export const StyledExploreFilters = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  flex: 1;
  min-width: 10rem;
  max-width: 75%;
  margin: 0 3rem;
`;

export const StyledIdsFilter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
`;

export const StyledIdsFilterHint = styled.span`
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["gray"][600]};
  white-space: nowrap;
`;

export const StyledChipInputBox = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  align-content: flex-start;
  gap: 0.4rem;
  // grow with content, then scroll within the (height-bounded) panel
  flex: 1 1 auto;
  min-height: 6rem;
  overflow-y: auto;
  padding: 0.3rem 0.5rem;
  cursor: text;
  background-color: ${({ theme }) => theme.color["white"]};
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-style: solid;
  border-color: ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  &:focus-within {
    border-color: ${({ theme }) => theme.color["info"]};
  }
`;

export const StyledIdsFloatingRoot = styled.div`
  position: absolute;
  right: 2rem;
  bottom: calc(2rem + ${FLOATING_SEARCH_COLLAPSED_SIZE}px + 1.5rem);
  z-index: 161;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
`;

export const StyledIdsToggleWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.6rem 1.2rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ theme }) => theme.color.invertedBg["info"]};
  box-shadow: ${({ theme }) => theme.boxShadow.high};
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: ${({ theme }) => theme.boxShadow.normal};
  }
`;

export const StyledIdsToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.color["info"]};
  background: transparent;
`;

export const StyledIdsToggleClear = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.color["info"]};
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;

export const StyledIdsCountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.6rem;
  height: 1.6rem;
  padding: 0 0.4rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ theme }) => theme.color["info"]};
  color: ${({ theme }) => theme.color["white"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

export const StyledIdsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 30rem;
  max-width: calc(100vw - 4rem);
  min-height: 0;
  padding: 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.color["invertedBg"]["info"]};
  box-shadow: ${({ theme }) => theme.boxShadow.high};
  overflow: hidden;
`;

export const StyledIdsPanelHeader = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const StyledIdsPanelTitle = styled.span`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.color["primary"]};
`;

export const StyledIdsPanelFooter = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const StyledUuidChip = styled.span<{ $selected?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  max-width: 100%;
  padding: 0.1rem 0.2rem 0.1rem 0.5rem;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme, $selected }) => ($selected ? theme.color["white"] : theme.color["primary"])};
  background-color: ${({ theme, $selected }) =>
    $selected ? theme.color["info"] : theme.color["gray"][200]};
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-style: solid;
  border-color: ${({ theme, $selected }) =>
    $selected ? theme.color["info"] : theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  white-space: nowrap;
`;

export const StyledUuidChipRemove = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.color["gray"][600]};
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;

export const StyledChipTextInput = styled.input<{ $invalid?: boolean }>`
  flex: 1;
  min-width: 8rem;
  border: none;
  outline: none;
  background: transparent;
  padding: 0.2rem;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ $invalid }) => ($invalid ? 700 : "inherit")};
  color: ${({ theme, $invalid }) => ($invalid ? theme.color["danger"] : theme.color["primary"])};
  text-decoration: ${({ $invalid }) => ($invalid ? "underline wavy" : "none")};
  text-decoration-color: ${({ theme, $invalid }) =>
    $invalid ? theme.color["danger"] : "transparent"};
  text-decoration-skip-ink: none;
  &::placeholder {
    color: ${({ theme }) => theme.color["gray"][500]};
    font-weight: inherit;
    text-decoration: none;
  }
`;

export const StyledClearAllButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: transparent;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["gray"][600]};
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;
