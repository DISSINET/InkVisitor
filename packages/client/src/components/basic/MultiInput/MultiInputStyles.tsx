import styled from "styled-components";

export const StyledRow = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
`;

// trash icon floats in the note's top-right corner, revealed on hover
export const StyledDeleteButton = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.space[1]};
  right: ${({ theme }) => theme.space[1]};
  z-index: 1;
  opacity: 0;
  transition: opacity 0.15s ease;

  ${StyledRow}:hover & {
    opacity: 1;
  }
`;
