import styled from "styled-components";

export const StyledTableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;
  width: 100%;
`;
interface StyledGrid {
  $columns: number;
}
export const StyledGrid = styled.div<StyledGrid>`
  display: grid;
  border: 1px solid ${({ theme }) => theme.color["black"]};
  align-content: start;
  /* grid-template-columns: ${({ $columns }) =>
    `auto repeat(${$columns}, 1fr)`}; */
  grid-template-columns: ${({ $columns }) =>
    `3.5rem repeat(${$columns}, auto)`};
  color: ${({ theme }) => theme.color["black"]};
  width: 100%;
`;
export const StyledGridColumn = styled.div`
  display: grid;
  border-right: 1px solid ${({ theme }) => theme.color["black"]};
  border-top: 1px solid ${({ theme }) => theme.color["blue"][300]};
  padding: 0.3rem;
  padding-left: 1rem;
  background-color: ${({ theme }) => theme.color["white"]};
  align-items: center;

  > :not(:last-child) {
    margin-bottom: 0.3rem;
  }
`;

interface StyledGridHeader {
  $greyBackground?: boolean;
}
export const StyledGridHeader = styled(StyledGridColumn)<StyledGridHeader>`
  background-color: ${({ theme, $greyBackground }) =>
    $greyBackground ? theme.color["gray"][600] : theme.color["success"]};
  color: ${({ theme, $greyBackground }) =>
    $greyBackground ? theme.color["white"] : "white"};
  border: none;
  height: 3rem;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  align-items: end;
  padding-bottom: 0.5rem;
`;

export const StyledNewColumn = styled.div`
  width: 27rem;
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  /* border-left: 2px solid ${({ theme }) => theme.color["gray"][400]}; */

  position: sticky;
  top: 0;
`;
export const StyledNewColumnGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: repeat(4, 2.5rem);
  gap: 1rem;
  padding: 1rem;
`;
export const StyledNewColumnLabel = styled.div`
  display: flex;
  align-items: center;
  white-space: nowrap;
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledNewColumnValue = styled.div`
  display: grid;
  align-items: center;
`;
export const StyledSpaceBetween = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
export const StyledTableHeader = styled(StyledSpaceBetween)`
  padding: ${({ theme }) => theme.space[2]};
  padding-top: 0.2rem;
`;
export const StyledTableFooter = styled(StyledSpaceBetween)`
  padding: ${({ theme }) => theme.space[2]};
  padding-bottom: 0.2rem;
`;
export const StyledEmpty = styled.span`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

interface StyledExpandedRow {
  $columnsSpan: number;
}
export const StyledExpandedRow = styled.div<StyledExpandedRow>`
  display: flex;
  flex-wrap: wrap;

  /* display: grid; */
  /* grid-template-columns: repeat(auto-fill, minmax(38rem, 1fr)); */

  gap: 1rem;

  grid-column: ${({ $columnsSpan }) => `span ${$columnsSpan}`};
  padding: 0.5rem;
  padding-left: 4rem;
  min-height: 5rem;
  border-right: 1px solid ${({ theme }) => theme.color["black"]};
`;
export const StyledExpRowSection = styled.div`
  display: inline-flex;
  flex-direction: column;
  flex: 1 1 38rem;
  border: 1px dashed ${({ theme }) => theme.color["black"]};
  min-height: 20rem;
  padding-right: 2rem;
`;

export const StyledExpRowFormGrid = styled.div`
  display: inline-grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem;
`;

export const StyledExpRowSectionHeader = styled.div`
  display: flex;
  align-items: center;
  font-weight: ${({ theme }) => theme.fontWeight.regular};
  font-size: ${({ theme }) => theme.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.space[4]};
  color: ${({ theme }) => theme.color["primary"]};
`;
interface StyledExpRowSectionContent {
  $firstSection?: boolean;
}
export const StyledExpRowSectionContent = styled.div<StyledExpRowSectionContent>`
  padding-left: ${({ theme, $firstSection = false }) =>
    $firstSection ? "" : theme.space[4]};
  padding-top: ${({ theme, $firstSection }) =>
    $firstSection ? 0 : theme.space[4]};
`;
export const StyledExpRowFormGridColumnLabel = styled.div`
  display: grid;
  justify-content: end;
  margin-top: 0.5rem;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["success"]};
`;
export const StyledExpRowFormGridColumnValue = styled.div`
  display: grid;
  align-items: end;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledExpRowFormGridColumnValueID = styled.div`
  color: ${({ theme }) => theme.color["primary"]};
  display: inline-flex;
  align-items: flex-end;
  font-style: italic;
  font-size: ${({ theme }) => theme.fontSize["xs"]};

  button {
    margin-left: ${({ theme }) => theme.space["2"]};
  }
`;

export const StyledPagination = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
