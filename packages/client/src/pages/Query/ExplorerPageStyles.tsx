import styled from "styled-components";

// Explorer box header: result-expansion checkboxes (#2969) next to the
// table/stats view switch; right margin keeps them clear of the box buttons.
export const StyledExplorerHeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  margin-right: ${({ theme }) => theme.space[8]};
`;
