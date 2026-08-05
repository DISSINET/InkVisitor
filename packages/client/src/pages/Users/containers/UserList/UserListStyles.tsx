import { BOX_HEADER_HEIGHT, heightHeader } from "Theme/constants";
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
  /* hugs the table and centres in the full-width box, and stays the scroll
     container the sticky header measures against once the table outgrows it */
  width: fit-content;
  max-width: 100%;
  margin: 0 auto;
  /* Bound the height so the table body scrolls and the header can stick. The
     page header and the box header are the only things above it, so the table
     runs to the bottom edge. */
  max-height: calc(100vh - ${heightHeader / 10}rem - ${BOX_HEADER_HEIGHT / 10}rem);
  overflow: auto;
  /* only the top rounds here: the bottom edge is a scroll boundary that falls
     mid-row, so the last row rounds its own corners instead */
  border-radius: ${({ theme }) => `${theme.borderRadius.default} ${theme.borderRadius.default} 0 0`};
`;

/*
 * Per-column floors, in table order: identity, role, read, write, annotate,
 * actions. Column widths are driven by cell content, so an empty body - while
 * the first fetch runs, or when no user matches the filter - would otherwise
 * collapse every column to the width of its caption.
 */
const COLUMN_MIN_WIDTHS = ["26rem", "12rem", "16rem", "16rem", "16rem", "10rem"];

export const StyledTable = styled.table`
  /* separate, because collapse discards border-radius on cells and drops
     borders on the sticky ones; every rule below draws borders per cell so no
     edge is doubled */
  border-collapse: separate;
  width: 100%;
  border-spacing: 0;

  ${COLUMN_MIN_WIDTHS.map(
    (minWidth, index) => css`
      th:nth-child(${index + 1}),
      td:nth-child(${index + 1}) {
        min-width: ${minWidth};
      }
    `,
  )}

  tbody tr:last-child td:first-child {
    border-bottom-left-radius: ${({ theme }) => theme.borderRadius.default};
  }
  tbody tr:last-child td:last-child {
    border-bottom-right-radius: ${({ theme }) => theme.borderRadius.default};
  }
  /* the role accent bar is painted inside the cell, so it needs the same curve */
  tbody tr:last-child td:first-child::before {
    border-bottom-left-radius: inherit;
  }
`;
export const StyledTHead = styled.thead`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  background-color: ${({ theme }) => theme.color.tableHeaderBg};
  color: ${({ theme }) => theme.color["gray"][700]};
`;
export const StyledTh = styled.th`
  text-align: left;
  font-style: italic;
  font-weight: ${({ theme }) => theme.fontWeight["light"]};
  color: ${({ theme }) => theme.color["info"]};
  /* matches the body cell padding in StyledTr so a caption lines up with the
     column it labels */
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[3]}`};
  /* Keep the header visible while the body scrolls */
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: ${({ theme }) => theme.color.tableHeaderBg};
  border-top: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][400]};

  &:first-child {
    left: 0;
    /* above both the sticky header row and the sticky first column */
    z-index: 2;
    padding-left: ${({ theme }) => theme.space[2]};
    padding-right: ${({ theme }) => theme.space[2]};
    border-left: 1px solid ${({ theme }) => theme.color["gray"][400]};
    border-top-left-radius: ${({ theme }) => theme.borderRadius.default};
  }

  &:last-child {
    border-right: 1px solid ${({ theme }) => theme.color["gray"][400]};
    border-top-right-radius: ${({ theme }) => theme.borderRadius.default};
  }
`;

export type UserListRowFlash = "activate" | "deactivate" | "role" | false;

/** Privileged roles are marked by an edge bar on the first cell, not a row wash */
export type UserListRoleAccent = "owner" | "admin" | false;

interface StyledTr {
  $isOdd?: boolean;
  opacity?: number;
}
export const StyledTr = styled.tr<StyledTr>`
  background-color: ${({ theme }) => theme.color["white"]};
  color: ${({ theme }) => theme.color["black"]};
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  padding: ${({ theme }) => theme.space[1]};
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
  $roleAccent?: UserListRoleAccent;
  $isInactive?: boolean;
}
export const StyledTd = styled.td<StyledTd>`
  padding-top: ${({ theme }) => `${theme.space[1]}`};
  padding-right: ${({ theme }) => `${theme.space[2]}`};
  padding-bottom: ${({ theme }) => `${theme.space[1]}`};
  padding-left: 0;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  vertical-align: middle;
  /* the row owns the colour for every state, including hover; a sticky cell
     needs an opaque one of its own to cover the columns sliding under it */
  background: inherit;
  /* the row cannot carry the grid line: a separated table never paints a
     border set on <tr> */
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][400]};

  &:last-child {
    border-right: 1px solid ${({ theme }) => theme.color["gray"][400]};
  }

  /* dims the contents rather than the cell: the cell's own background has to
     stay opaque for the sticky column to cover what scrolls beneath it */
  ${({ $isInactive }) =>
    $isInactive &&
    css`
      & > * {
        opacity: 0.45;
      }
    `}

  &:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    border-left: 1px solid ${({ theme }) => theme.color["gray"][400]};
  }

  ${({ $roleAccent, theme }) =>
    $roleAccent &&
    css`
      /* the sticky cell is a positioned element, so it carries the bar */
      &:first-child::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 0.4rem;
        background-color: ${$roleAccent === "owner"
          ? theme.color["warning"]
          : theme.color["info"]};
      }
    `}

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

/* "all" and "-" state what the role implies, they are not stored values */
export const StyledTerritoryColumnAllLabel = styled.div`
  font-style: italic;
  color: ${({ theme }) => theme.color["gray"][600]};
`;

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
  $verified: boolean;
}
export const StyledUserNameColumn = styled.div<StyledUserNameColumn>`
  /* an inactive row is dimmed as a whole by StyledTd, so only the unverified
     state colours the identity itself */
  color: ${({ theme, $verified }) => (!$verified ? theme.color.warning : theme.color.black)};
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

export const StyledNotActiveText = styled.p`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color.warning};
`;

/*
 * Sits in the box header, which supplies the band, its height and its padding.
 * That header is styled as a caption — Muni, uppercase, bold — so the controls
 * restate the body typography they would otherwise inherit.
 */
export const StyledToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[4]};
  width: 100%;
  font-family: "Roboto", sans-serif;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  text-transform: none;
  letter-spacing: 0.2px;
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

/* Separated from the filters by a rule, since these act on the page rather
   than on what the table shows */
export const StyledToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding-left: ${({ theme }) => theme.space[4]};
  border-left: 1px solid ${({ theme }) => theme.color["gray"][400]};
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

/* Reproduces the margins StyledPropButtonGroup carries, so a row stating its
   role lines up with the rows offering the control */
export const StyledRoleBadgeWrap = styled.div`
  display: inline-flex;
  margin-left: ${({ theme }) => theme.space[3]};
  margin-right: ${({ theme }) => theme.space[3]};
`;

export const StyledEmptyCell = styled.td`
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-top: 0;
  border-bottom-left-radius: ${({ theme }) => theme.borderRadius.default};
  border-bottom-right-radius: ${({ theme }) => theme.borderRadius.default};
  padding: ${({ theme }) => theme.space[8]};
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["gray"][600]};
`;

interface StyledEditableText {
  $readOnly?: boolean;
}
export const StyledEditableText = styled.span<StyledEditableText>`
  width: fit-content;
  max-width: 100%;
  padding: 0 ${({ theme }) => theme.space[1]};
  margin-left: -${({ theme }) => theme.space[1]};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  cursor: ${({ $readOnly }) => ($readOnly ? "default" : "text")};
  /* an address that outruns the column is cut rather than wrapped, so every row
     keeps the same two-line height */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover,
  &:focus-visible {
    outline: ${({ theme, $readOnly }) =>
      $readOnly ? "none" : `1px dashed ${theme.color["gray"][450]}`};
  }
`;

export const StyledEditableName = styled(StyledEditableText)`
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;

