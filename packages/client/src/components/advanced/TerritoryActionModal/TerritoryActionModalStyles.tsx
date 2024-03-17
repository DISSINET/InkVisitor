import styled from "styled-components";

export const StyledGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  /* row-gap: 1rem; */
  margin-top: 1rem;
`;
export const StyledHeadingColumn = styled.p`
  display: grid;
  justify-items: end;
  margin-right: 1rem;
`;
export const StyledFlexRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  margin-top: 1rem;
`;
