import styled from "styled-components";

export const StyledTable = styled.table`
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;
  background-color: lightpink;
`;
export const StyledTHead = styled.thead`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledTh = styled.th`
  text-align: left;
  font-style: italic;
  font-weight: ${({ theme }) => theme.fontWeight["light"]};
  padding-bottom: ${({ theme }) => theme.space[1]};
`;

interface StyledTr {
  isOdd?: boolean;
  isSelected?: boolean;
  opacity?: number;
}
export const StyledTr = styled.tr<StyledTr>`
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  td:first-child {
    padding-left: ${({ theme }) => theme.space[1]};
    padding-right: ${({ theme }) => theme.space[2]};
  }
  td:not(:last-child) {
    width: 1%;
  }
`;
export const StyledTd = styled.td`
  padding-top: ${({ theme }) => `${theme.space[1]}`};
  padding-right: ${({ theme }) => `${theme.space[2]}`};
  padding-bottom: ${({ theme }) => `${theme.space[1]}`};
  padding-left: 0;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;

export const StyledSubRow = styled.div`
  display: table-row;
  width: 100%;
  padding: ${({ theme }) => theme.space[2]};
  border-left: 1px dashed;
  border-left-color: ${({ theme }) => theme.color["gray"][800]};
  margin-left: ${({ theme }) => `${theme.space[10]}`};
  margin-bottom: ${({ theme }) => `${theme.space[2]}`};
`;
