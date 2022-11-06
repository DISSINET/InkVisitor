import styled from "styled-components";

export const StyledContent = styled.div`
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: start;
  padding-left: 1rem;
  background-color: ${({ theme }) => theme.color["white"]};
  padding-bottom: 1rem;
  overflow: auto;
`;

export const StyledHeader = styled.div`
  width: 100%;
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

export const StyledFolderList = styled.div`
  width: 100%;
`;
