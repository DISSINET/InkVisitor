import styled from "styled-components";

// `table-layout: fixed` takes the column widths from the header row, so this is
// also the offset the second sticky column is pinned at
export const COLUMN_WIDTH = 150;

interface StyledTableContainer {
  $height: number;
  $width: number;
}
export const StyledTableContainer = styled.div<StyledTableContainer>`
  /* display: flex; */
  /* $width/$height are the space the layout offers, not the space the table
     needs: the box hugs the table and scrolls only past the offer. the self
     alignment opts out of the stretch a grid or flex parent would impose */
  align-self: start;
  justify-self: start;
  width: fit-content;
  height: fit-content;
  max-width: ${({ $width }) => $width}px;
  max-height: ${({ $height }) => $height}px;
  overflow: auto;
  /* the box is exactly as wide as the table, so a vertical scrollbar drawn
     inside it would push the table into a horizontal scroll of its own */
  scrollbar-gutter: stable;
  /* cells that are not pinned stay transparent, so the surface comes from here */
  background: ${({ theme }) => theme.color.gray[100]};
  border: 1px solid ${({ theme }) => theme.color.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.color.gray[900]};
`;

export const StyledEmptyState = styled.div<StyledTableContainer>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ $width }) => $width}px;
  height: ${({ $height }) => $height}px;
  color: ${({ theme }) => theme.color.gray[500]};
  font-size: ${({ theme }) => theme.fontSize.base};
`;

interface StyledTable {
  $width: number;
}
export const StyledTable = styled.table<StyledTable>`
  border-collapse: collapse;
  width: ${({ $width }) => $width}px;
  table-layout: fixed;
`;

interface StyledTh {
  $isSticky?: boolean;
  $stickyOffset?: number;
}
export const StyledTh = styled.th<StyledTh>`
  background: ${({ theme }) => theme.color.gray[200]};
  padding: ${({ theme }) => theme.space[2]};
  text-align: left;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  border-bottom: 2px solid ${({ theme }) => theme.color.gray[400]};
  white-space: nowrap;
  font-size: 14px;
  width: ${COLUMN_WIDTH}px;
  position: sticky;
  top: 0;
  z-index: 1;
  ${({ $isSticky, $stickyOffset = 0 }) =>
    $isSticky &&
    `
    left: ${$stickyOffset}px;
    z-index: 2;
    `}
`;

interface StyledTd {
  $isSticky?: boolean;
  $stickyOffset?: number;
  $isTotalRow?: boolean;
}
export const StyledTd = styled.td<StyledTd>`
  padding: ${({ theme }) => theme.space[2]};
  border-bottom: 1px solid
    ${({ theme, $isTotalRow }) =>
      $isTotalRow ? theme.color.gray[400] : theme.color.gray[200]};
  width: ${COLUMN_WIDTH}px;
  font-size: 13px;
  white-space: nowrap;
  font-weight: ${({ theme, $isTotalRow, $isSticky }) =>
    $isTotalRow || $isSticky ? theme.fontWeight.bold : theme.fontWeight.normal};
  /* the two pinned columns scroll over the rest of the row, so they carry an
     opaque fill; the totals row keeps its own fill across all of its cells */
  background: ${({ theme, $isTotalRow, $isSticky }) => {
    if ($isTotalRow) return theme.color.gray[300];
    if ($isSticky) return theme.color.gray[100];
    return "transparent";
  }};

  ${({ $isSticky, $stickyOffset = 0 }) =>
    $isSticky &&
    `
    position: sticky;
    left: ${$stickyOffset}px;
    z-index: 1;
    `}
`;
