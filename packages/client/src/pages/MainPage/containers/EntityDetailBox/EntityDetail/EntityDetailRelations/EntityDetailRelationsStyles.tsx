import styled from "styled-components";

export const StyledRelationsGrid = styled.div`
  display: grid;
  grid-template-columns: auto auto 1fr;
  grid-gap: ${({ theme }) => theme.space[4]};
`;
