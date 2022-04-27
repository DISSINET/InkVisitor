import styled from "styled-components";

export const StyledDots = styled.div`
  display: flex;
  align-items: flex-end;
  cursor: default;
`;

export const StyledLoaderWrap = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const StyledSelectorCell = styled.div`
  cursor: pointer;
  margin: -0.5em 0em;
`;

export const StyledActionLabel = styled.div`
  font-size: 90%;
  max-width: 12em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
export const StyledText = styled.p`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledTableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;
`;
