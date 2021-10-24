import styled from "styled-components";

export const StyledContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: start;
`;

export const StyledHeader = styled.div`
  width: 100%;
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

export const StyledFolderList = styled.div`
  width: 100%;
`;
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
  display: inline-block;
  color: ${({ theme }) => theme.color["gray"][700]};
  padding: ${({ theme }) => theme.space[3]};
`;
export const StyledFolderHeaderText = styled.span`
  vertical-align: text-bottom;
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  margin-left: ${({ theme }) => theme.space[2]};
  max-width: calc(100% - 5em);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;
export const StyledFolderWrapperOpenArea = styled.span`
  cursor: pointer;
  display: inline-block;
`;
export const StyledFolderHeaderButtons = styled.div`
  display: inline-block;
  float: right;
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
