import styled from "styled-components";

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
}
export const StyledTh = styled.th<StyledTh>`
  background: ${({ theme }) => theme.color.gray[100]};
  padding: ${({ theme }) => theme.space[2]};
  text-align: left;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  border-bottom: 2px solid ${({ theme }) => theme.color.gray[200]};
  white-space: nowrap;
  font-size: 14px;
  width: 150px;
  position: sticky;
  top: 0;
  z-index: 1;
  ${({ $isSticky }) =>
    $isSticky &&
    `
    left: 0;
    z-index: 2;
    `}
`;

interface StyledTd {
  $isSticky?: boolean;
}
export const StyledTd = styled.td<StyledTd>`
  padding: ${({ theme }) => theme.space[2]};
  border-bottom: 1px solid ${({ theme }) => theme.color.gray[200]};
  width: 100px;
  font-size: 13px;

  ${({ $isSticky, theme }) =>
    $isSticky &&
    `
    position: sticky;
    left: 0;
    background: ${theme.color.gray[100]};
    z-index: 1;
    font-weight: ${theme.fontWeight.bold};
    `}
`;
