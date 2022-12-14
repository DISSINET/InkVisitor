import styled from "styled-components";

export const StyledFolderWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.space[0]};
  width: 100%;
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-style: solid;
  border-color: ${({ theme }) => theme.color["gray"][400]};
  box-shadow: ${({ theme }) => theme.boxShadow["subtle"]};
  background-color: ${({ theme }) => theme.color["white"]};
  :hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;
export const StyledFolderHeader = styled.div`
  width: 100%;
  height: ${({ theme }) => theme.space[14]};
  display: inline-flex;
  overflow: hidden;
  color: ${({ theme }) => theme.color["gray"][700]};
  padding: ${({ theme }) => theme.space[3]};
`;
export const StyledFolderHeaderText = styled.div`
  vertical-align: text-bottom;
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  margin-left: ${({ theme }) => theme.space[2]};
  margin-right: ${({ theme }) => theme.space[1]};
  width: 100%;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;
export const StyledFolderWrapperOpenArea = styled.div`
  cursor: pointer;
  display: inline-flex;
  overflow: hidden;
  width: 100%;
`;
export const StyledFolderHeaderButtons = styled.div`
  display: flex;
  align-items: start;
`;
export const StyledFolderContent = styled.div`
  padding: ${({ theme }) => theme.space[3]};
`;

export const StyledFolderContentTags = styled.div`
  display: block;
  padding-bottom: ${({ theme }) => theme.space[6]};
`;
export const StyledFolderContentTag = styled.div`
  padding-right: ${({ theme }) => theme.space[2]};
  padding-bottom: ${({ theme }) => theme.space[1]};
  display: inline-block;
`;
export const StyledFolderSuggester = styled.div``;
export const StyledIconWrap = styled.div`
  width: ${({ theme }) => theme.space[7]};
`;
