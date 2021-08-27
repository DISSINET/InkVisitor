import styled from "styled-components";

export const StyledRow = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ theme }) => theme.space[2]};
`;
