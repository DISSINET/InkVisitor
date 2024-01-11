import styled from "styled-components";

export const StyledInverseRelationRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-gap: ${({ theme }) => `0 ${theme.space[6]}`};
  margin-bottom: ${({ theme }) => theme.space[2]};
`;
