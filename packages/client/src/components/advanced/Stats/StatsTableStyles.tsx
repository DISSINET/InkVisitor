import styled from "styled-components";

interface StyledTableContainer {
  $height: number;
  $width: number;
}
export const StyledTableContainer = styled.div<StyledTableContainer>`
  /* display: flex; */
  /* $width/$height are the space the layout offers, not the space the table
     needs: the box hugs the table and scrolls only past the offer. the auto
     inline margins split any leftover, so a small table sits horizontally
     centered in the offer while staying pinned to its top */
  margin: 0 auto;
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

/* auto table layout: every column takes the width of its widest cell, header
   or body — the nowrap on cells is what keeps that width single-line */
/* separate borders: collapsed borders are painted by the table, not the cells,
   so they scroll away from the pinned header and totals row and leave a gap */
export const StyledTable = styled.table`
  border-collapse: separate;
  border-spacing: 0;
`;

interface StyledTh {
  $isSticky?: boolean;
  $stickyOffset?: number;
}
export const StyledTh = styled.th<StyledTh>`
  background: ${({ theme }) => theme.color.tableHeaderBg};
  /* the wide inline padding is the breathing room between content-sized
     columns */
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[4]}`};
  text-align: left;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  border-bottom: 2px solid ${({ theme }) => theme.color.gray[400]};
  white-space: nowrap;
  font-size: 14px;
  position: sticky;
  top: 0;
  /* above the pinned totals row, which sticks right below the header */
  z-index: 3;
  ${({ $isSticky, $stickyOffset = 0 }) =>
    $isSticky &&
    `
    left: ${$stickyOffset}px;
    z-index: 4;
    `}
`;

interface StyledTd {
  $isSticky?: boolean;
  $stickyOffset?: number;
  $isTotalRow?: boolean;
  $stickyTop?: number;
}
export const StyledTd = styled.td<StyledTd>`
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[4]}`};
  border-bottom: 1px solid
    ${({ theme, $isTotalRow }) =>
      $isTotalRow ? theme.color.gray[400] : theme.color.gray[200]};
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

  /* the totals row stays under the header while the body scrolls beneath it;
     its two pinned cells stay above the rest of the row that scrolls sideways */
  ${({ $isTotalRow, $isSticky, $stickyTop = 0 }) =>
    $isTotalRow &&
    `
    position: sticky;
    top: ${$stickyTop}px;
    z-index: ${$isSticky ? 3 : 2};
    `}
`;
