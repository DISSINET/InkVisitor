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
export const StyledSectionUsed = styled.div`
  display: block;
`;

export const StyledSectionUsedTable = styled.div`
  display: grid;
  align-items: center;
  padding-left: ${({ theme }) => theme.space[0]};
  grid-template-columns: auto auto auto auto;
  width: fit-content;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-top: ${({ theme }) => theme.space[6]};
  padding-bottom: ${({ theme }) => theme.space[6]};
`;

export const StyledSectionUsedText = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

export const StyledSectionUsedPageManager = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  display: inline-flex;
  align-items: center;
  button {
    margin: 0 ${({ theme }) => theme.space[2]};
  }
`;

export const StyledSectionUsedTableCell = styled.div<StyledSectionMetaTableCell>`
  display: inline-flex;
  margin-bottom: ${({ theme, lastSecondLevel }) =>
    lastSecondLevel ? theme.space[2] : theme.space[2]};
  align-items: center;
  padding: 0 5px;
  border-right: ${({ theme, borderless }) =>
    borderless ? "none" : "1px dashed black"};
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
  borderless?: boolean;
}
export const StyledSectionMetaTableCell = styled.div<StyledSectionMetaTableCell>`
  display: inline-flex;
  margin-bottom: ${({ theme, lastSecondLevel }) =>
    lastSecondLevel ? theme.space[2] : theme.space[2]};
  align-items: center;
  padding: 0 5px;
  border-right: ${({ theme, borderless }) =>
    borderless ? "none" : "1px dashed black"};
`;
