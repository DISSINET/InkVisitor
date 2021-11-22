import { Button, ButtonGroup } from "components";
import styled from "styled-components";

export const StyledHeader = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  position: absolute;
  padding: ${({ theme }) => theme.space[3]};
  background: ${({ theme }) => theme.color["gray"][200]};
  /* max-height: 9rem; */
`;
export const StyledHeaderBreadcrumbRow = styled.div`
  display: flex;
  align-items: center;
`;
export const StyledHeaderRow = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
`;
export const StyledTitle = styled.h3`
  display: inline-flex;
`;
