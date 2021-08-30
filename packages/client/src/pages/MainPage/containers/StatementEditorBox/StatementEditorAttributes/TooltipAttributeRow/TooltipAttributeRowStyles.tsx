import styled from "styled-components";

export const StyledRow = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledValue = styled.p`
  margin-left: ${({ theme }) => theme.space[2]};
`;
