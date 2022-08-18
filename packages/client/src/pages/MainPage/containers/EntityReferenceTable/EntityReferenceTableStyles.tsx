import styled from "styled-components";

// references
interface StyledReferencesList {}
export const StyledReferencesList = styled.div<StyledReferencesList>`
  display: grid;
  align-items: center;
  padding-left: ${({ theme }) => theme.space[0]};
  grid-template-columns: 1fr 1fr 2rem;
  width: fit-content;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-bottom: ${({ theme }) => theme.space[6]};
  max-width: 100%;
`;

interface StyledListHeaderColumn {}
export const StyledListHeaderColumn = styled.div<StyledListHeaderColumn>`
  font-weight: ${({ theme }) => theme.fontWeight.light};
  margin-left: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["info"]};
  text-align: left;
  font-style: italic;
`;

interface StyledReferencesListColumn {}
export const StyledReferencesListColumn = styled.div<StyledReferencesListColumn>`
  margin: ${({ theme }) => theme.space[1]};
  display: grid;
  align-items: center;
`;

export const StyledReferencesListButtons = styled.div`
  button {
    display: inline-flex;
    margin-right: ${({ theme }) => theme.space[2]};
  }
`;

export const StyledTagWrapper = styled.div`
  display: inline-flex;
  overflow: hidden;
`;
export const StyledReferenceValuePartLabel = styled.div`
  font-style: italic;
  display: inline;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  margin-right: ${({ theme }) => theme.space[4]}; ;
`;
