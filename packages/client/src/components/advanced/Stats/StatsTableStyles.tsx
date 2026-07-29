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
  width: ${({ $width }) => $width}px;
  height: ${({ $height }) => $height}px;
  overflow: auto;
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
  background: ${({ theme }) => theme.color.gray[100]};
  padding: ${({ theme }) => theme.space[2]};
  text-align: left;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  border-bottom: 2px solid ${({ theme }) => theme.color.gray[200]};
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
  border-bottom: 1px solid ${({ theme }) => theme.color.gray[200]};
  width: ${COLUMN_WIDTH}px;
  font-size: 13px;
  white-space: nowrap;

  ${({ $isTotalRow, theme }) =>
    $isTotalRow &&
    `
    background: ${theme.color.gray[150]};
    font-weight: ${theme.fontWeight.bold};
    `}

  ${({ $isSticky, $stickyOffset = 0, theme }) =>
    $isSticky &&
    `
    position: sticky;
    left: ${$stickyOffset}px;
    background: ${theme.color.gray[100]};
    z-index: 1;
    font-weight: ${theme.fontWeight.bold};
    `}
`;
