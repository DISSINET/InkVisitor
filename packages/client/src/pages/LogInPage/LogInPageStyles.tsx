import styled from "styled-components";

export const StyledPage = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.color["primary"]};
  color: ${({ theme }) => theme.color["white"]};
`;

export const StyledLogInBox = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
`;
