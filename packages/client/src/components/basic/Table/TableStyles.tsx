import styled from "styled-components";

interface StyledTable {
  $noBorder: boolean;
  $equalColumns: boolean;
}
export const StyledTable = styled.table<StyledTable>`
  width: 100%;
  /* fixed layout splits the width evenly between columns regardless of
   content length; cells rely on their own overflow handling */
  table-layout: ${({ $equalColumns }) => ($equalColumns ? "fixed" : "auto")};
  border-spacing: 0;
  /* separate keeps the border on the table itself, so the radius renders and
     the header rule stays a single line - the statement list table is drawn
     the same way */
  border-collapse: separate;
  border-width: ${({ theme, $noBorder }) => ($noBorder ? 0 : theme.borderWidth[1])};
  border-style: solid;
  border-color: ${({ theme }) => theme.color["gray"][500]};
  box-shadow: ${({ theme, $noBorder }) => ($noBorder ? "none" : theme.boxShadow["subtle"])};
  border-radius: ${({ theme, $noBorder }) => ($noBorder ? 0 : theme.borderRadius["input"])};
  overflow: hidden;
`;
export const StyledTHead = styled.thead`
  background: ${({ theme }) => theme.color["gray"][100]};
  color: ${({ theme }) => theme.color["gray"][700]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: bold;
`;
export const StyledTh = styled.th`
  text-align: left;
  padding-right: ${({ theme }) => theme.space[2]};
  padding-left: ${({ theme }) => theme.space[2]};
  white-space: nowrap;
  border-bottom: ${({ theme }) => theme.borderWidth[1]} solid
    ${({ theme }) => theme.color["gray"][500]};
`;

interface StyledTableHeader {
  $position: "top" | "bottom";
}
export const StyledTableHeader = styled.div<StyledTableHeader>`
  display: flex;
  align-items: center;
  margin-bottom: ${({ $position }) => ($position === "top" ? "0.3rem" : "")};
  margin-top: ${({ $position }) => ($position === "bottom" ? "0.5rem" : "")};
`;

interface StyledTr {
  opacity?: number;
  $noBorder: boolean;
  $fullWidthColumn: number;
  $firstColumnMinWidth: boolean;
  $lastColumnMinWidth: boolean;
  $hasOnClick?: boolean;
}
export const StyledTr = styled.tr<StyledTr>`
  background-color: ${({ theme }) => theme.color["white"]};
  color: ${({ theme }) => theme.color["black"]};
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  /* the head already draws the rule above the first row; separate borders do
     not merge, so a border-top there would stack a second line on it */
  &:not(:first-child) {
    border-top: ${({ theme, $noBorder }) =>
      $noBorder ? "" : `1px solid ${theme.color["gray"][500]}`};
  }
  cursor: ${({ $hasOnClick }) => ($hasOnClick ? "pointer" : "")};

  &:hover {
    background-color: ${({ theme, $noBorder }) => ($noBorder ? "" : theme.color["gray"][100])};
  }
  td:not(:nth-child(${({ $fullWidthColumn }) => $fullWidthColumn})) {
    width: ${({ $fullWidthColumn }) => ($fullWidthColumn > 0 ? "1%" : "")};
  }
  td:first-child {
    width: ${({ $firstColumnMinWidth }) => ($firstColumnMinWidth ? "1%" : "")};
  }
  td:last-child {
    width: ${({ $lastColumnMinWidth }) => ($lastColumnMinWidth ? "1%" : "")};
  }
`;
interface StyledTd {
  $noBorder: boolean;
}
export const StyledTd = styled.td<StyledTd>`
  padding: ${({ theme, $noBorder }) => ($noBorder ? "1px" : theme.space[2])};
  padding-left: ${({ theme }) => theme.space[4]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledHeading = styled.div`
  display: flex;
  margin-right: auto;
`;
export const StyledPagination = styled.div`
  display: flex;
  margin-left: auto;
  gap: 0.1rem;
`;
export const StyledPageNumber = styled.div`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  margin: ${({ theme }) => `0 ${theme.space[1]}`};
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.color["info"]};
`;
export const StyledUsedInTitle = styled.div`
  padding-left: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color["info"]};
`;
export const StyledTableContainer = styled.div`
  position: relative;
  margin-bottom: ${({ theme }) => theme.space[8]};
`;
