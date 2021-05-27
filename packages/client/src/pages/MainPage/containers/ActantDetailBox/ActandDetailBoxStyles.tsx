import styled from "styled-components";

export const StyledContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: start;
`;

export const StyledSectionHeader = styled.div`
  display: block;
  input,
  select {
    margin: ${({ theme }) => `0 ${theme.space[5]}`};
  }
`;
export const StyledContentRow = styled.div`
  display: flex;
`;

export const StyledSectionMeta = styled.div`
  display: block;
`;
export const StyledSectionMetaTable = styled.div`
  display: grid;
  align-items: center;
  padding-left: ${({ theme }) => theme.space[0]};
  grid-template-columns: auto auto auto auto auto;
  width: fit-content;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-top: ${({ theme }) => theme.space[6]};
  padding-bottom: ${({ theme }) => theme.space[6]};
`;

interface StyledSectionMetaTableButtonGroup {
  leftMargin?: boolean;
}
export const StyledSectionMetaTableButtonGroup = styled.div<StyledSectionMetaTableButtonGroup>`
  margin-left: ${({ theme, leftMargin = true }) =>
    leftMargin ? theme.space[3] : theme.space[0]};
  vertical-align: middle;
  display: inline-flex;
`;

interface StyledSectionMetaTableCell {
  padded?: boolean;
  lastSecondLevel?: boolean;
}
export const StyledSectionMetaTableCell = styled.div<StyledSectionMetaTableCell>`
  display: inline-flex;
  margin-bottom: ${({ theme, lastSecondLevel }) =>
    lastSecondLevel ? theme.space[4] : theme.space[4]};
  align-items: center;
  padding-left: ${({ theme, padded }) =>
    padded ? theme.space[6] : theme.space[0]};
  padding-right: 5px;
  border-right: 1px dashed black;
`;
