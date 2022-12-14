import styled from "styled-components";

export const StyledText = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xl"]};
`;
export const StyledError = styled.h1`
  font-weight: bold;
`;
export const StyledContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;
export const StyledBoxWrapper = styled.div`
  margin: 2rem 3rem;
  display: flex;
  flex-direction: column;
`;
