import styled from "styled-components";

export const StyledAuditTable = styled.div`
  display: table;
`;
export const StyledAuditRow = styled.div`
  display: table-row;
  padding: ${({ theme }) => theme.space[2]};
`;
export const StyledAuditColumn = styled.div`
  display: table-cell;
  padding-left: ${({ theme }) => theme.space[6]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  svg {
    vertical-align: text-top;
    margin-right: ${({ theme }) => theme.space[2]};
  }
`;
export const StyledAuditEllipsis = styled.div`
  display: table-row;
  text-align: center;
`;
