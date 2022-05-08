import styled from "styled-components";

interface StyledTable {}
export const StyledTable = styled.table<StyledTable>`
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-style: solid;
  border-color: ${({ theme }) => theme.color["gray"][500]};
  box-shadow: ${({ theme }) => theme.boxShadow["subtle"]};
`;
export const StyledTHead = styled.thead`
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-style: solid;
  border-color: ${({ theme }) => theme.color["gray"][500]};
  background: ${({ theme }) => theme.color["gray"][100]};
  color: ${({ theme }) => theme.color["gray"][700]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledTh = styled.th`
  text-align: left;
  padding-right: ${({ theme }) => theme.space[2]};
  padding-left: ${({ theme }) => theme.space[2]};
  font-weight: normal;
`;

interface StyledTableHeader {
  position: "top" | "bottom";
  pagingUseless?: boolean;
}
export const StyledTableHeader = styled.div<StyledTableHeader>`
  display: flex;
  align-items: center;
  margin-bottom: ${({ position }) => (position === "top" ? "0.3rem" : "")};
  margin-top: ${({ position }) => (position === "bottom" ? "0.5rem" : "")};
`;

interface StyledTr {
  opacity?: number;
}
export const StyledTr = styled.tr<StyledTr>`
  background-color: ${({ theme }) => theme.color["white"]};
  color: ${({ theme }) => theme.color["black"]};
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  border-top: 1px solid ${({ theme }) => theme.color["gray"][500]};
  :hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
  /* Preparation for one fullWidth column */
  /* td:not(:nth-child(2)) {
    width: 1%;
  } */
`;
export const StyledTd = styled.td`
  padding: ${({ theme }) => theme.space[2]};
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
`;
export const StyledPageNumber = styled.div`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  margin: ${({ theme }) => `0 ${theme.space[2]}`};
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
  margin-bottom: ${({ theme }) => theme.space[4]};
`;
