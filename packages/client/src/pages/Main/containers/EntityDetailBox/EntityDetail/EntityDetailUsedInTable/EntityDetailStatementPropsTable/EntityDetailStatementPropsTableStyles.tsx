import styled from "styled-components";

export const StyledTableWrapper = styled.div`
  margin-top: 1rem;
  margin-bottom: 2.5rem;
`;
export const StyledHeading = styled.div`
  display: flex;
  margin-right: auto;
`;
export const StyledUsedInTitle = styled.div`
  padding-left: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color["info"]};
`;
