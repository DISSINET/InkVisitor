import styled from "styled-components";

export const StyledContent = styled.div`
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: start;
  margin-top: 0.3rem;
  padding-left: 0.5rem;
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
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding-right: 0.3rem;
`;
