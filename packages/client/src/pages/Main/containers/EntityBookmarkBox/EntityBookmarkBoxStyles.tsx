import styled from "styled-components";

// the scroller itself, so its background also covers the scrollbar
export const StyledContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: start;
  padding-top: 0.3rem;
  padding-left: 0.6rem;
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
  gap: 0.5rem;
  padding-right: 0.3rem;
`;
