import styled from "styled-components";

// the background sits outside the scroller so it also covers the scrollbar
export const StyledBoxContent = styled.div`
  height: 100%;
  background-color: ${({ theme }) => theme.color["white"]};
`;

export const StyledContent = styled.div`
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: start;
  padding-top: 0.3rem;
  padding-left: 0.6rem;
  padding-bottom: 1rem;
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
