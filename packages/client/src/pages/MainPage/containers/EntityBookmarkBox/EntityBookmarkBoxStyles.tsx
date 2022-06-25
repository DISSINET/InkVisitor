import styled from "styled-components";

export const StyledContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: start;
  padding-left: 1rem;
  background-color: ${({ theme }) => theme.color["white"]};
`;

export const StyledHeader = styled.div`
  width: 100%;
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

export const StyledFolderList = styled.div`
  width: 100%;
`;
