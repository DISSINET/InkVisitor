import styled, { css, keyframes } from "styled-components";

/** One fade after row settles; delay + duration set on StyledTr */
const rowActivateFlash = keyframes`
  0% {
    box-shadow: inset 0 0 0 9999px rgba(188, 229, 255, 0);
  }
  42% {
    box-shadow: inset 0 0 0 9999px rgba(188, 229, 255, 0.42);
  }
  100% {
    box-shadow: inset 0 0 0 9999px rgba(188, 229, 255, 0);
  }
`;

/** Same timing as activate; warning-toned (deactivate) */
const rowDeactivateFlash = keyframes`
  0% {
    box-shadow: inset 0 0 0 9999px rgba(216, 170, 55, 0);
  }
  42% {
    box-shadow: inset 0 0 0 9999px rgba(216, 170, 55, 0.38);
  }
  100% {
    box-shadow: inset 0 0 0 9999px rgba(216, 170, 55, 0);
  }
`;

export const ROW_FLASH_DELAY_MS = 200;
export const ROW_FLASH_DURATION_MS = 1750;
/** Clear React flash state shortly after CSS animation ends */
export const ROW_FLASH_CLEAR_AFTER_MS =
  ROW_FLASH_DELAY_MS + ROW_FLASH_DURATION_MS + 120;

export const StyledTableWrapper = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  overflow: auto;
`;

export const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
  border-spacing: 0;
  border: 1px solid transparent;
`;
export const StyledTHead = styled.thead`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-style: solid;
  border-color: ${({ theme }) => theme.color["gray"][400]};
  background-color: ${({ theme }) => theme.color["gray"][100]};
  color: ${({ theme }) => theme.color["gray"][700]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledTh = styled.th`
  text-align: left;
  font-style: italic;
  font-weight: ${({ theme }) => theme.fontWeight["light"]};
  padding-bottom: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color["info"]};
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[4]}`};
`;

export type UserListRowFlash = "activate" | "deactivate" | false;

interface StyledTr {
  $isOdd?: boolean;
  opacity?: number;
  $isOwner: boolean;
  $isAdmin: boolean;
  $flash?: UserListRowFlash;
}
export const StyledTr = styled.tr<StyledTr>`
  background-color: ${({ theme, $isOwner, $isAdmin }) =>
    $isOwner
      ? theme.color["invertedBg"]["primary"]
      : $isAdmin
      ? theme.color["invertedBg"]["info"]
      : theme.color["white"]};
  color: ${({ theme, $isOwner }) => theme.color["black"]};
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  padding: ${({ theme }) => theme.space[1]};
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  position: relative;
  ${({ $flash }) =>
    $flash === "activate" &&
    css`
      animation: ${rowActivateFlash} ${ROW_FLASH_DURATION_MS}ms ease-out
        ${ROW_FLASH_DELAY_MS}ms forwards;
    `}
  ${({ $flash }) =>
    $flash === "deactivate" &&
    css`
      animation: ${rowDeactivateFlash} ${ROW_FLASH_DURATION_MS}ms ease-out
        ${ROW_FLASH_DELAY_MS}ms forwards;
    `}

  td:first-child {
    padding-left: ${({ theme }) => theme.space[2]};
    padding-right: ${({ theme }) => theme.space[2]};
  }
  td:not(:last-child) {
    /* width: 1%; */
    padding-right: ${({ theme }) => theme.space[8]};
  }
  td,
  th {
    padding-left: ${({ theme }) => theme.space[3]};
    padding-right: ${({ theme }) => theme.space[3]};
  }
  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;

export const StyledTd = styled.td`
  padding-top: ${({ theme }) => `${theme.space[1]}`};
  padding-right: ${({ theme }) => `${theme.space[2]}`};
  padding-bottom: ${({ theme }) => `${theme.space[1]}`};
  padding-left: 0;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;

export const StyledTerritoryColumn = styled.div`
  display: block;
`;

export const StyledTerritoryColumnAllLabel = styled.div``;

export const StyledTerritoryList = styled.div`
  display: block;

  padding-top: ${({ theme }) => theme.space[2]};
`;
export const StyledTerritoryListItem = styled.div`
  padding-right: ${({ theme }) => theme.space[2]};
  padding-bottom: ${({ theme }) => theme.space[1]};
  display: inline-block;
`;
export const StyledTerritoryListItemMissing = styled.div`
  padding: ${({ theme }) => theme.space[2] + " " + theme.space[3]};
  display: inline-flex;
  gap: ${({ theme }) => theme.space[0] + " " + theme.space[2]};
  align-items: center;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  background-color: ${({ theme }) => theme.color.danger};
  color: ${({ theme }) => theme.color.white};
  font-size: ${({ theme }) => theme.fontSize.xxs};
`;
interface StyledUserNameColumn {
  $active: boolean;
  $verified: boolean;
}
export const StyledUserNameColumn = styled.div<StyledUserNameColumn>`
  color: ${({ theme, $active, $verified }) =>
    !$verified
      ? theme.color.warning
      : $active
      ? theme.color.black
      : theme.color.grey};
  display: inline-flex;
  width: 100%;
`;
export const StyledUserNameColumnIcon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  font-size: 2.5rem;
  margin-right: 0.8rem;
  width: 3rem;
`;
export const StyledUserNameColumnText = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
`;
export const StyledUserEditor = styled.div`
  columns: auto auto;
`;

export const StyledUserEditorSection = styled.div``;

export const StyledUserEditorTitle = styled.div``;
export const StyledUserEditorBody = styled.div``;
export const StyledUserEditorFoot = styled.div``;

export const StyledUserEditorRow = styled.div`
  /* class: row; */
  /* display: flex; */
`;
export const StyledUserEditorRowLabel = styled.div`
  float: left;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledUserEditorRowValue = styled.div`
  float: right;
`;

export const StyledUserEditorForm = styled.div`
  display: flex;
  padding: 1rem;

  input {
    margin-right: ${({ theme }) => theme.space[3]};
  }
`;

export const StyledUtils = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }) => theme.color["blue"][50]};
  width: 100%;
`;
export const StyledNotActiveText = styled.p`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color.warning};
`;
