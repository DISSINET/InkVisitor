import styled from "styled-components";

export const StyledText = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xl"]};
`;
export const StyledError = styled.h1`
  font-weight: bold;
`;
export const StyledContentWrapper = styled.div`
  margin: 2rem 3rem;
  display: flex;
  flex-direction: column;
`;
