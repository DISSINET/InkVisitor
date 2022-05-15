import styled from "styled-components";

export const StyledBoxContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${({ theme }) => theme.color["white"]};
`;

export const StyledTemplateSection = styled.div`
  position: relative;
  padding: ${({ theme }) => theme.space[6]};
  border-bottom-width: ${({ theme }) => theme.borderWidth[1]};
  border-bottom-color: ${({ theme }) => theme.color["gray"][500]};
  background-color: ${({ theme }) => theme.color["white"]};
  border-bottom-style: solid;
  :hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;
export const StyledTemplateSectionHeader = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.regular};
  font-size: ${({ theme }) => theme.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.space["2"]};
  color: ${({ theme }) => theme.color["primary"]};
  display: flex;
  button {
    margin-left: ${({ theme }) => theme.space["2"]};
  }
`;

export const StyledTemplateSectionList = styled.div`
  > div {
    padding: ${({ theme }) => theme.space["1"]};
  }
`;

export const StyledTemplateFilterInputRow = styled.div``;
export const StyledTemplateFilterInputLabel = styled.div``;
export const StyledTemplateFilterInputValue = styled.div``;

export const StyledTemplateFilter = styled.div`
  display: table;
  ${StyledTemplateFilterInputRow} {
    display: table-row;
    width: 100%;
  }
  ${StyledTemplateFilterInputLabel} {
    width: 1%;
    white-space: nowrap;
    display: table-cell;
    padding: ${({ theme }) => theme.space[3]};
    vertical-align: top;
    text-align: right;
    float: initial;
  }
  ${StyledTemplateFilterInputValue} {
    display: table-cell;
    width: 100%;
    padding: ${({ theme }) => theme.space[2]};
  }
`;
