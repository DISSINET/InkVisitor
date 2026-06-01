import styled from "styled-components";

export const StyledOverflowTooltipContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[1]};
  width: max-content;
  max-width: min(40rem, calc(100vw - 2rem));
  align-content: flex-start;
  align-self: flex-start;
  flex-shrink: 0;
  padding-left: 0.5rem;

  > * {
    flex-shrink: 0;
  }
`;

export const StyledOverflowTextList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  width: max-content;
  max-width: min(40rem, calc(100vw - 2rem));
  align-self: flex-start;
  flex-shrink: 0;
`;
