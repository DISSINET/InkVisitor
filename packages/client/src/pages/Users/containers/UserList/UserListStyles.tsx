import styled, { css, keyframes } from "styled-components";

/** One fade after row settles; delay + duration set on StyledTd */
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

/** Same timing as activate; violet-toned (role change) */
const rowRoleFlash = keyframes`
  0% {
    box-shadow: inset 0 0 0 9999px rgba(191, 173, 255, 0);
  }
  42% {
    box-shadow: inset 0 0 0 9999px rgba(191, 173, 255, 0.40);
  }
  100% {
    box-shadow: inset 0 0 0 9999px rgba(191, 173, 255, 0);
  }
`;

export const ROW_FLASH_DELAY_MS = 200;
export const ROW_FLASH_DURATION_MS = 1750;
/** Clear React flash state shortly after CSS animation ends */
export const ROW_FLASH_CLEAR_AFTER_MS = ROW_FLASH_DELAY_MS + ROW_FLASH_DURATION_MS + 120;

export const StyledTableWrapper = styled.div`
  position: relative;
  display: block;
  width: 100%;
  /* Bound the height so the table body scrolls and the header can stick.
     Offset accounts for the page header (~7rem) plus the utils bar below. */
  max-height: calc(100vh - 11rem);
  overflow: auto;
`;

export const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
  border-spacing: 0;
`;
export const StyledTHead = styled.thead`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
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
  /* Keep the header visible while the body scrolls. Borders are recreated with
     box-shadow because border-collapse drops borders on sticky cells. The
     first, non-inset shadow extends the header background upwards over the
     sliver of scroll container that sits above a sticky cell's border box. */
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: ${({ theme }) => theme.color["gray"][100]};
  box-shadow:
    0 -0.6rem 0 0 ${({ theme }) => theme.color["gray"][100]},
    inset 0 1px 0 ${({ theme }) => theme.color["gray"][400]},
    inset 0 -1px 0 ${({ theme }) => theme.color["gray"][400]};

  &:first-child {
    left: 0;
    /* above both the sticky header row and the sticky first column */
    z-index: 2;
  }
`;

export type UserListRowFlash = "activate" | "deactivate" | "role" | false;

interface StyledTr {
  $isOdd?: boolean;
  opacity?: number;
  $isOwner: boolean;
  $isAdmin: boolean;
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

interface StyledTd {
  $flash?: UserListRowFlash;
}
export const StyledTd = styled.td<StyledTd>`
  padding-top: ${({ theme }) => `${theme.space[1]}`};
  padding-right: ${({ theme }) => `${theme.space[2]}`};
  padding-bottom: ${({ theme }) => `${theme.space[1]}`};
  padding-left: 0;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  /* the row owns the colour for every state, including hover; a sticky cell
     needs an opaque one of its own to cover the columns sliding under it */
  background: inherit;

  &:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    /* wide enough for a full address on one line, so the identity column does
       not wrap the majority of emails */
    min-width: 30rem;
  }

  ${({ $flash }) =>
    $flash === "activate" &&
    css`
      animation: ${rowActivateFlash} ${ROW_FLASH_DURATION_MS}ms ease-out ${ROW_FLASH_DELAY_MS}ms
        forwards;
    `}
  ${({ $flash }) =>
    $flash === "deactivate" &&
    css`
      animation: ${rowDeactivateFlash} ${ROW_FLASH_DURATION_MS}ms ease-out ${ROW_FLASH_DELAY_MS}ms
        forwards;
    `}
  ${({ $flash }) =>
    $flash === "role" &&
    css`
      animation: ${rowRoleFlash} ${ROW_FLASH_DURATION_MS}ms ease-out ${ROW_FLASH_DELAY_MS}ms
        forwards;
    `}
`;

export const StyledTerritoryColumn = styled.div`
  display: block;
  /* a column is as wide as its widest cell, so capping the tags here is what
     keeps a user with several rights from stretching the whole column */
  max-width: 20rem;
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
    !$verified ? theme.color.warning : $active ? theme.color.black : theme.color.grey};
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

export const StyledToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[4]};
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[4]}`};
  background-color: ${({ theme }) => theme.color["blue"][50]};
  /* the page wraps the table in a centring flex column, so the bar has to claim
     the full width to sit flush with the table rather than shrink to its own
     content */
  width: 100%;
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][400]};
`;

export const StyledToolbarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
`;

export const StyledToolbarCount = styled.div`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["gray"][600]};
  white-space: nowrap;
`;

/** Holds the width the clear button occupies so the count does not shift */
export const StyledToolbarClear = styled.div`
  display: flex;
  align-items: center;
  min-width: 3rem;
  justify-content: flex-end;
`;

export const StyledRightsCellSuggester = styled.div`
  padding-top: ${({ theme }) => theme.space[1]};
`;

export const StyledEmptyCell = styled.td`
  padding: ${({ theme }) => theme.space[8]};
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["gray"][600]};
`;

export const StyledEditableText = styled.span`
  width: fit-content;
  max-width: 100%;
  padding: 0 ${({ theme }) => theme.space[1]};
  margin-left: -${({ theme }) => theme.space[1]};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  cursor: text;
  /* an address that outruns the column is cut rather than wrapped, so every row
     keeps the same two-line height */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover,
  &:focus-visible {
    outline: 1px dashed ${({ theme }) => theme.color["gray"][450]};
  }
`;

export const StyledEditableName = styled(StyledEditableText)`
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;

