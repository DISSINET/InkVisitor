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

export const StyledContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  flex-direction: row;
`;
interface StyledBoxWrap {}
export const StyledBoxWrap = styled.div<StyledBoxWrap>`
  max-width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;
export const StyledBackground = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin: 2rem;
  padding: 1rem;
  border: 1px dashed ${({ theme }) => theme.color["black"]};
  background-color: ${({ theme }) => theme.color["white"]};
  box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

export const StyledGridScrollArea = styled.div`
  padding-right: 0.5rem;
  min-height: 0;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-self: stretch;
`;

/** Shared by header + body so column tracks align in one grid */
export const documentsGridColumns = "minmax(18rem, 1fr) auto minmax(10rem, 17.4rem) max-content";

const stickyHeaderCell = css`
  position: sticky;
  top: 0;
  z-index: 1;
  background: ${({ theme }) => theme.color["white"]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][500]};
  height: 2.5rem;
`;

export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: ${documentsGridColumns};
  align-items: center;
  min-width: min-content;
  margin-bottom: 0.5rem;
  padding-right: 0.5rem;
  overflow: auto;
`;

export const StyledGridHeader = styled.div`
  display: contents;
`;

export const StyledDocumentRow = styled.div`
  display: contents;
`;

export const StyledHeaderCell = styled.div`
  padding: 0.5rem 1rem;
  color: ${({ theme }) => theme.color["gray"][700]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  white-space: nowrap;
  ${stickyHeaderCell}
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
  padding: 0.5rem 1rem;
`;

export const StyledTitleWrap = styled.div`
  min-width: 0;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  padding: 0.5rem 1rem;
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
  min-width: 0;
  max-width: 17.4rem;
  position: relative;
  padding: 0.5rem 1rem;
`;
export const StyledHeading = styled.div`
  flex-shrink: 0;
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["lg"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  margin-bottom: ${({ theme }) => theme.space[2]};
  padding-left: ${({ theme }) => theme.space[1]};
`;

export const StyledCount = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  display: inline-flex;
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
