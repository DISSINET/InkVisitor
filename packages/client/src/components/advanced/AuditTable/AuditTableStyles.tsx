import styled from "styled-components";

export const StyledAuditTable = styled.div`
  display: table;
`;
export const StyledAuditRow = styled.div`
  display: table-row;
  padding: ${({ theme }) => theme.space[2]};
`;
interface StyledAuditColumn {
  $wrap?: boolean;
}
export const StyledAuditColumn = styled.div<StyledAuditColumn>`
  display: table-cell;
  padding-left: ${({ theme }) => theme.space[6]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  white-space: ${({ $wrap }) => ($wrap ? "normal" : "nowrap")};
  svg {
    vertical-align: text-top;
    margin-right: ${({ theme }) => theme.space[2]};
  }
`;
export const StyledAuditEllipsis = styled.div`
  display: table-row;
  text-align: center;
`;
