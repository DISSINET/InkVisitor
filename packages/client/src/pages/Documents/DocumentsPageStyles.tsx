import styled, { css } from "styled-components";
import { StyledScrollbar } from "components/basic/CustomScrollbar/CustomScrollbarStyles";

/**
 * Documents grid can scroll on both axes; the library’s gutter margin/padding can break horizontal extent.
 * Neutralize that here only (shared CustomScrollbar stays unchanged) and hide the *native* overflow
 * scrollbar on the scroller so only the custom tracks show.
 */
export const DocumentsStyledScrollbar = styled(StyledScrollbar)`
  .ScrollbarsCustom-Scroller {
    margin-right: 0 !important;
    margin-bottom: 0 !important;
    padding-right: 0 !important;
    padding-bottom: 0 !important;
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }
  }
`;

/**
 * Box body. The table is as wide as its columns need and sits in the middle of
 * the box - stretched across a wide monitor, a document's name and its anchor
 * counts end up at opposite edges of the screen.
 *
 * The toolbar, the list and the upload area are one vertically centered group,
 * so a handful of documents reads at eye level with its controls beside it
 * rather than split between the top and the bottom of a tall box.
 */
export const StyledDocumentsContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 0;
  padding: ${({ theme }) => theme.space[4]};
`;

/**
 * Column holding the toolbar, the table and the upload area at one width. The
 * white surface stops at its edges - the box around it stays page background.
 */
export const StyledDocumentsColumn = styled.div`
  display: flex;
  flex-direction: column;
  width: fit-content;
  max-width: 100%;
  min-height: 0;
  padding: ${({ theme }) => theme.space[4]};
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][300]};
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
`;

/** Grows only as far as the rows need, then scrolls within what is left */
export const StyledGridScrollArea = styled.div`
  padding-right: 0.5rem;
  flex: 0 1 auto;
  min-height: 0;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  overflow: auto;
`;

/** Shared by header + body so column tracks align in one grid */
export const documentsGridColumns =
  "max-content minmax(18rem, 1fr) auto minmax(10rem, 17.4rem) max-content";

const stickyHeaderCell = css`
  position: sticky;
  top: 0;
  z-index: 1;
  background: ${({ theme }) => theme.color["white"]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][500]};
  min-height: 2.5rem;
  margin-bottom: ${({ theme }) => theme.space[2]};
`;

/**
 * Cells stretch to the full row height so a row-wide fill has no gaps; each
 * cell centers its own content vertically.
 */
export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: ${documentsGridColumns};
  align-items: stretch;
  min-width: min-content;
  margin-bottom: 0.5rem;
  padding-right: 0.5rem;
`;

export const StyledGridHeader = styled.div`
  display: contents;
`;

/**
 * Cells are grid items of the shared grid, so the row itself lays out nothing
 * and the hover fill has to be painted on the cells it contains.
 */
export const StyledDocumentRow = styled.div`
  display: contents;

  &:hover > * {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }

  &:hover > *:first-child {
    border-top-left-radius: ${({ theme }) => theme.borderRadius["default"]};
    border-bottom-left-radius: ${({ theme }) => theme.borderRadius["default"]};
  }

  &:hover > *:last-child {
    border-top-right-radius: ${({ theme }) => theme.borderRadius["default"]};
    border-bottom-right-radius: ${({ theme }) => theme.borderRadius["default"]};
  }
`;

export const StyledSortableHeaderCell = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  padding: 0.5rem 1rem;
  border: none;
  color: ${({ theme, $active }) => ($active ? theme.color["primary"] : theme.color["gray"][700])};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  white-space: nowrap;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  ${stickyHeaderCell}

  &:hover {
    color: ${({ theme }) => theme.color["primary"]};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color["primary"]};
    outline-offset: -2px;
  }
`;

export const StyledSortIndicator = styled.span`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  line-height: 1;
`;

export const StyledActionsCell = styled.div`
  display: flex;
  align-items: center;
`;

/** Bulk export sits over the per-row action buttons, so it shares their offset */
export const StyledActionsHeaderCell = styled.div`
  display: flex;
  align-items: center;
  ${stickyHeaderCell}
`;

export const StyledBulkExportWrap = styled.div`
  position: relative;
  display: inline-flex;
`;

/** Rides the button's top-right corner; clicks pass through to the button */
export const StyledBulkExportCount = styled.span`
  position: absolute;
  top: -0.2rem;
  right: -0.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.2rem;
  height: 1.2rem;
  padding: 0 0.25rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ theme }) => theme.color["success"]};
  color: ${({ theme }) => theme.color["white"]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  line-height: 1;
  pointer-events: none;
`;

export const StyledSelectCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.5rem 0 0.8rem;
`;

export const StyledSelectHeaderCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.5rem 0 0.8rem;
  ${stickyHeaderCell}
`;

/** Disabled rows keep the box in place so the column stays aligned */
export const StyledDisabledSelect = styled.div`
  opacity: 0.4;
  cursor: not-allowed;
`;

export const StyledTitleWrap = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  padding: 0px 1rem 0px 0.8rem;
`;
export const StyledTitle = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  max-width: 100%;
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden !important;
  text-overflow: ellipsis;
  padding: 0.3rem 0;
`;
export const StyledReference = styled.div`
  display: grid;
  align-items: center;
  min-width: 0;
  max-width: 17.4rem;
  position: relative;
  padding: 0.2rem 1rem;
`;
export const StyledCount = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  padding: 0.5rem 1rem;
`;

export const StyledCountTag = styled.div`
  padding: 2px 6px;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  cursor: default;
`;

export const StyledInputWrap = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  height: 5rem;
  min-width: 40rem;
  margin-top: 1rem;
  padding: 0.3rem 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  background: ${({ theme }) => `
    repeating-linear-gradient(
    -45deg,
    ${theme.color.white},
    ${theme.color.white},
    2px,
    ${theme.color.uploadDocumentBg} 1px,
    ${theme.color.uploadDocumentBg} 12px
  )
  `};
`;
