import styled from "styled-components";

export const StyledHeader = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: ${({ theme }) => theme.space[3]};
  background: ${({ theme }) => theme.color["gray"][200]};
`;
export const StyledHeaderBreadcrumbRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
`;
export const StyledHeaderRow = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
`;
export const StyledTitle = styled.h3`
  display: inline-flex;
`;
