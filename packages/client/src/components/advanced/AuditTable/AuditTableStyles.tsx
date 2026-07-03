import styled from "styled-components";

interface StyledAuditTable {
  $columns: number;
}
export const StyledAuditTable = styled.div<StyledAuditTable>`
  display: grid;
  grid-template-columns: ${({ $columns }) => `repeat(${$columns}, auto)`};
  align-items: start;
  column-gap: ${({ theme }) => theme.space[6]};
  row-gap: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color["black"]};
  width: fit-content;
`;
// participates as plain grid items in the parent's grid, so columns stay
// aligned across rows the same way the old table layout did
export const StyledAuditRow = styled.div`
  display: contents;
`;
interface StyledAuditColumn {
  $wrap?: boolean;
}
export const StyledAuditColumn = styled.div<StyledAuditColumn>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  flex-wrap: ${({ $wrap }) => ($wrap ? "wrap" : "nowrap")};
  height: 2rem;
  svg {
    flex-shrink: 0;
  }
`;
export const StyledAuditEllipsis = styled.div`
  grid-column: 1 / -1;
  text-align: center;
`;
// last column of a relation-audit row: stacks the relation type on the first
// line and the connected entities directly beneath it, while the other columns
// stay on the top line (grid align-items: start keeps them top-aligned)
export const StyledRelationAuditCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize.xs};
`;
export const StyledRelationAuditType = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;
export const StyledRelationAuditEntities = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.2rem;
`;
export const StyledRelationAuditEmpty = styled.div`
  padding: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-style: italic;
  color: ${({ theme }) => theme.color["black"]};
`;
export const StyledLoadMoreWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${({ theme }) => theme.space[2]};
`;
