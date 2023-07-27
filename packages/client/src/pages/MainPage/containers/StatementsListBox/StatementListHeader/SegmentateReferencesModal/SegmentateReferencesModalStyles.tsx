import styled from "styled-components";

export const StyledHeaderRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;
export const StyledHeading = styled.div`
  color: ${({ theme }) => theme.color["primary"]};
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  margin-right: 0.5rem;
`;
