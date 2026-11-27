import styled from "styled-components";

export const StyledAsymmetricalAnchorWarning = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  font-style: italic;

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.color["warning"]};
  }
`;
