import styled from "styled-components";

interface StyledSpareRow {
  $marginTop?: boolean;
}
export const StyledSpareRow = styled.div<StyledSpareRow>`
  display: flex;
  gap: 0.5rem;
  margin-top: ${({ $marginTop }) => ($marginTop ? "3rem" : 0)};
  margin-left: 2rem;
`;
