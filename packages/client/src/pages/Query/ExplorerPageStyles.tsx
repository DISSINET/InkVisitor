import styled from "styled-components";

// Query Builder box buttons: compact result-expansion checkboxes (#2969),
// grouped as a single ButtonGroup item next to "run search".
export const StyledResultExpansionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  padding: 0 ${({ theme }) => theme.space[2]};
`;
