import styled from "styled-components";

/** Width (px) the caret button occupies in the tab strip. */
export const OVERFLOW_TAB_WIDTH = 46;

export const StyledOverflowButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
  flex-shrink: 0;
  width: ${OVERFLOW_TAB_WIDTH}px;
  cursor: pointer;
  background-color: ${({ theme }) => theme.color["gray"][100]};
  color: ${({ theme }) => theme.color["black"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  padding: 0;

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][300]};
  }
`;

export const StyledOverflowCount = styled.span`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["gray"][700]};
`;

export const StyledOverflowList = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 16rem;
  max-width: 26rem;
  overflow-y: auto;
  padding: ${({ theme }) => theme.space[1]} 0;
  background-color: ${({ theme }) => theme.color["gray"][100]};
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-radius: 3px;
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
`;

export const StyledOverflowRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  cursor: pointer;
  background-color: transparent;

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][200]};
  }
`;

export const StyledOverflowTagWrap = styled.div`
  flex: 1;
  min-width: 0;

  /* a tag that cannot be dragged carries a default cursor, but here the whole
     row is clickable */
  &,
  & * {
    cursor: pointer;
  }
`;
