import styled from "styled-components";

export const StyledSubmitContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;
export const StyledNoWrap = styled.div`
  white-space: nowrap;
`;
