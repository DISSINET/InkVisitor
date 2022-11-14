import styled from "styled-components";

export const StyledInverseRelations = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-gap: ${({ theme }) => `${theme.space[2]} ${theme.space[6]}`};
`;
