import styled from "styled-components";

export const StyledRow = styled.div`
  display: flex;
  /* align-items: center; */
`;

export const StyledValue = styled.p`
  margin-left: ${({ theme }) => theme.space[2]};
`;
export const StyledValues = styled.div`
  display: flex;
  flex-wrap: wrap;
`;
export const StyledIconWrap = styled.span`
  margin-top: 2px;
`;
