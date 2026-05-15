import styled from "styled-components";

export const StyledQueryEntityDetail = styled.div`
  display: grid;
  width: 100%;
  overflow: auto;
  padding: 0.5rem;
  padding-left: 1rem;
  min-height: 5rem;
`;
export const StyledDetailSection = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  margin-bottom: 1rem;

  border: 1px dotted ${({ theme }) => theme.color["grey"]};
  padding: 0.5rem 2rem 2rem 0.5rem;

  transition: all 300ms ease;

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;

/* Use grid instead of multicol — Firefox has layout bugs with column-count/inline-flex */
export const ColumnsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1450px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;
export const StyledColumnItem = styled.div`
  display: inline-block;
  width: 100%;
`;

export const StyledDetailFormGrid = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr); /* minmax(0,1fr) prevents FF column blowout */
  gap: 0.5rem;
  min-width: 0;

  > * {
    min-width: 0; /* allow value cells to shrink in constrained columns */
  }
`;

export const StyledDetailSectionHeader = styled.div`
  display: flex;
  align-items: center;
  font-weight: ${({ theme }) => theme.fontWeight.normal};
  font-size: ${({ theme }) => theme.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.space[4]};
  color: ${({ theme }) => theme.color["primary"]};
`;
interface StyledDetailSectionContent {
  $firstSection?: boolean;
}
export const StyledDetailSectionContent = styled.div<StyledDetailSectionContent>`
  padding-left: ${({ theme, $firstSection = false }) => ($firstSection ? "" : theme.space[4])};
  padding-top: ${({ theme, $firstSection }) => ($firstSection ? 0 : theme.space[4])};
`;
export const StyledDetailFormGridColumnLabel = styled.div`
  display: grid;
  justify-content: end;
  margin-top: 0.5rem;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["success"]};
`;
export const StyledDetailFormGridColumnValue = styled.div`
  display: grid;
  align-items: end;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledDetailFormGridColumnValueID = styled.div`
  color: ${({ theme }) => theme.color["primary"]};
  display: flex;
  align-items: flex-end;
  font-style: italic;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  min-width: 0;

  button {
    margin-left: ${({ theme }) => theme.space["2"]};
  }
`;
export const StyledReferenceTable = styled.div`
  display: grid;
  grid-template-columns: auto;
  gap: 0.5rem;
  max-width: 100%;
`;
export const StyledReferenceRow = styled.div`
  display: inline-grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  max-width: 100%;
`;
