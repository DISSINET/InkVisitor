import styled from "styled-components";

export const StyledRelationsGrid = styled.div`
  display: grid;
  /* grid-template-columns: auto auto 1fr; */
  grid-template-columns: ${({ theme }) => theme.space[64]} auto;
  grid-gap: ${({ theme }) => theme.space[4]};
  padding-right: ${({ theme }) => theme.space[8]};
`;
