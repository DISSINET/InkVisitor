import styled from "styled-components";

export const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
`;
export const StyledNote = styled.i`
  margin-top: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  text-align: right;
`;
export const StyledAnchorElvlWrap = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;
export const StyledAnchorElvlLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["greyer"]};
`;
