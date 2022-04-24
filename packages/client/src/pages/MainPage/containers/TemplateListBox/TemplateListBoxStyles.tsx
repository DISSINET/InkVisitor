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

export const StyledTemplateSectionList = styled.div``;
