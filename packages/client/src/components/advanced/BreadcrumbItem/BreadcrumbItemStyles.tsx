import styled from "styled-components";

export const StyledItemBox = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  min-width: 5rem;

  color: ${({ theme }) => theme.color["info"]};
`;
